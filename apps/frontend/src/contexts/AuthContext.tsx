import type { AccountFragment } from '@nocena/indexer';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useActiveAccount, useActiveWallet, useDisconnect } from 'thirdweb/react';
import { signOut } from '../store/persisted/useAuthStore';

// GeoPoint for location-based challenges
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface NFTItem {
  id: string;
  name: string;
  description: string;
  itemType: string; // 'cap' | 'hoodie' | 'pants' | 'shoes'
  rarity: string; // 'common' | 'rare' | 'epic'
  tokenBonus: number;
  imageUrl: string;
  imageCID?: string;
  generatedAt: string;
  generationPrompt?: string;
  isEquipped: boolean;
  tokenId?: string;
  mintTransactionHash?: string;
}

export interface Avatar {
  id: string;
  baseImageUrl: string;
  generatedImageUrl: string;
  baseImageCID?: string;
  generatedImageCID?: string;
  equippedCap?: NFTItem;
  equippedHoodie?: NFTItem;
  equippedPants?: NFTItem;
  equippedShoes?: NFTItem;
  generationPrompt?: string;
  generatedAt: string;
  isActive: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  currentLensAccount: AccountFragment | undefined;
  setCurrentLensAccount: (account: AccountFragment | undefined) => void;
  setIsAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: false,
  currentLensAccount: undefined,
  setCurrentLensAccount: () => {},
  setIsAuthenticated: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentLensAccount, setCurrentLensAccount] = useState<AccountFragment | undefined>(
    undefined
  );

  // Refs to track state and prevent multiple calls
  const lastWalletAddress = useRef<string | null>(null);
  const isInitialized = useRef<boolean>(false);
  const isProcessingAuth = useRef<boolean>(false);
  const isMounted = useRef<boolean>(false);

  // Thirdweb v5 hooks
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  // Check if we're in browser environment
  const isBrowser = typeof window !== 'undefined';

  // Track mounting state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    if (isProcessingAuth.current) return;

    isProcessingAuth.current = true;

    try {
      console.log('[AuthContext] Logout initiated');
      signOut();
      setIsAuthenticated(false);
      setCurrentLensAccount(undefined);
      lastWalletAddress.current = null;

      // Disconnect the active wallet if there is one
      if (currentLensAccount && activeWallet) {
        try {
          disconnect(activeWallet);
        } catch (disconnectError) {
          // Ignore disconnect errors, just log them
          console.log('[AuthContext] Wallet disconnect error (non-critical):', disconnectError);
        }
      }

      console.log('[AuthContext] Logout successful');
    } catch (error) {
      console.error('[AuthContext] Error during logout:', error);
      // Still clear local state even if wallet disconnect fails
      setCurrentLensAccount(undefined);
      setIsAuthenticated(false);
      lastWalletAddress.current = null;
    } finally {
      if (isMounted.current) {
        isProcessingAuth.current = false;
      }
    }
  }, [currentLensAccount, activeWallet, disconnect]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        logout,
        currentLensAccount,
        setCurrentLensAccount,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
