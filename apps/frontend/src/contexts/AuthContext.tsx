import type { Account, AccountFragment } from '@nocena/indexer';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useActiveAccount, useActiveWallet, useDisconnect } from 'thirdweb/react';
import { signOut } from '../store/persisted/useAuthStore';

// Updated User interface - matches Dgraph schema exactly
export interface User {
  id: string;
  username: string;
  bio: string;
  wallet: string;
  profilePicture: string;
  coverPhoto: string;
  trailerVideo: string;
  earnedTokens: number;
  earnedTokensDay: number; // Maps to earnedTokensToday in Dgraph
  earnedTokensWeek: number; // Maps to earnedTokensThisWeek in Dgraph
  earnedTokensMonth: number; // Maps to earnedTokensThisMonth in Dgraph

  // Avatar fields - ADD THESE
  currentAvatar?: string;
  baseAvatar?: string;
  avatarHistory?: Avatar[];

  // Equipped NFT items - ADD THESE
  equippedCap?: NFTItem | null;
  equippedHoodie?: NFTItem | null;
  equippedPants?: NFTItem | null;
  equippedShoes?: NFTItem | null;

  // Personal Expression Fields (matching Dgraph schema)
  personalField1Type: string;
  personalField1Value: string;
  personalField1Metadata: string;
  personalField2Type: string;
  personalField2Value: string;
  personalField2Metadata: string;
  personalField3Type: string;
  personalField3Value: string;
  personalField3Metadata: string;

  pushSubscription?: string | null;

  // Lens Protocol Fields
  lensHandle?: string | null;
  lensAccountId?: string | null;
  lensTransactionHash?: string | null;
  lensMetadataUri?: string | null;

  // Relationships
  followers: string[]; // Array of user IDs
  following: string[]; // Array of user IDs
  notifications: Notification[];

  // Challenge relationships
  completedChallenges: ChallengeCompletion[];
  receivedPrivateChallenges: PrivateChallenge[];
  createdPrivateChallenges: PrivateChallenge[];
  createdPublicChallenges: PublicChallenge[];
  participatingPublicChallenges: PublicChallenge[];

  // AI challenge tracking
  dailyChallenge: string; // String of 365 characters (e.g., "000...0")
  weeklyChallenge: string; // String of 52 characters (e.g., "000...0")
  monthlyChallenge: string; // String of 12 characters (e.g., "000...0")
}

export interface CombinedUser extends User {
  lensAccount: Account | AccountFragment;
}

// GeoPoint for location-based challenges
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

// Base challenge interface
interface BaseChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  createdAt: string;
  isActive: boolean;
}

// Private Challenge
export interface PrivateChallenge extends BaseChallenge {
  expiresAt: string;
  creator: User | string; // Can be full User object or just ID
  targetUser: User | string;
  isCompleted: boolean;
  completions: ChallengeCompletion[];
}

// Public Challenge
export interface PublicChallenge extends BaseChallenge {
  creator: User | string;
  location: GeoPoint;
  maxParticipants: number;
  participantCount: number;
  participants: User[] | string[];
  completions: ChallengeCompletion[];
}

// AI Challenge
export interface AIChallenge extends BaseChallenge {
  frequency: string; // "daily", "weekly", "monthly"
  day?: number; // Day of year (1-365) for daily challenges
  week?: number; // Week of year (1-52) for weekly challenges
  month?: number; // Month (1-12) for monthly challenges
  year: number; // Year
  completions: ChallengeCompletion[];
}

// Unified Challenge Completion
export interface ChallengeCompletion {
  id: string;
  user: User | string;

  // Challenge references - only one of these will be set
  privateChallenge?: PrivateChallenge;
  publicChallenge?: PublicChallenge;
  aiChallenge?: AIChallenge;

  // Timing information
  completionDate: string;
  completionDay: number;
  completionWeek: number;
  completionMonth: number;
  completionYear: number;

  // Media field
  media: string; // JSON string with metadata

  // Social elements
  likes?: string[]; // User IDs
  likesCount: number;

  // Classification and status
  challengeType: string; // "private", "public", "ai"
  status: string; // "pending", "verified", "rejected"
}

// Enhanced Notification
export interface Notification {
  id: string;
  user: User | string;
  userId: string;

  triggeredBy?: User | string;
  triggeredById?: string;

  content: string;
  notificationType: string; // "follow", "private_challenge", "challenge_completed", etc.

  // Challenge references
  privateChallenge?: PrivateChallenge;
  publicChallenge?: PublicChallenge;
  aiChallenge?: AIChallenge;

  isRead: boolean;
  createdAt: string;
}

// Type for simplified challenge information in the user interface
export interface SimplifiedChallengeInfo {
  type: string; // "private", "public", "AI-daily", "AI-weekly", "AI-monthly"
  title: string;
  date: string;
  proofCID: string;
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
  currentLensAccount: AccountFragment | null,
  setCurrentLensAccount: (account: AccountFragment | null) => void,
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  currentLensAccount: null,
  setCurrentLensAccount: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentLensAccount, setCurrentLensAccount] = useState<AccountFragment | null>(null);

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
      setCurrentLensAccount(null)
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
      setCurrentLensAccount(null);
      setIsAuthenticated(false);
      lastWalletAddress.current = null;
    } finally {
      if (isMounted.current) {
        isProcessingAuth.current = false;
      }
    }
  }, [currentLensAccount, activeWallet, disconnect]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      loading,
      logout,
      currentLensAccount,
      setCurrentLensAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
