// pages/index.tsx - Minimalist design aligned with other screens
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { ConnectButton, useActiveAccount, useActiveWallet, useDisconnect } from 'thirdweb/react';
import { useAuth } from '../../contexts/AuthContext';
import AuthenticationLayout from '@components/layout/AuthenticationLayout';
import ThematicContainer from '@components/ui/ThematicContainer';
import { chain, client } from '../../lib/thirdweb';
import { wallets } from '../../lib/thirdweb/wallets';
import Login from '@components/auth/Login';
import RegistrationLinkSection from '@components/auth/RegistrationLinkSection';
import { useMeQuery } from '@nocena/indexer';
import { hydrateAuthTokens } from '../../store/persisted/useAuthStore';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletChecked, setWalletChecked] = useState(false);
  const { disconnect } = useDisconnect();
  const activeWallet = useActiveWallet();
  const { accessToken } = hydrateAuthTokens();

  const isProcessingLogin = useRef(false);
  const checkedAddresses = useRef<Set<string>>(new Set());

  const router = useRouter();
  const { login, isAuthenticated, currentLensAccount, setCurrentLensAccount } = useAuth();
  const thirdWebAccount = useActiveAccount();
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && currentLensAccount) {
      console.log('✅ User already authenticated, redirecting to home:', currentLensAccount.username);
      router.push('/home');
    }
  }, [isAuthenticated, currentLensAccount, router]);

  const { loading: meQueryLoading } = useMeQuery({
    variables: { request: { post: '' } },
    onCompleted: ({ me, pro }) => {
      setCurrentLensAccount(me.loggedInAs.account);
    },
    // onError,
    skip: !accessToken,
  });

  // Clear checked addresses when wallet disconnects
  useEffect(() => {
    if (!thirdWebAccount?.address) {
      checkedAddresses.current.clear();
    }
  }, [thirdWebAccount?.address]);

  return (
    <AuthenticationLayout title="Welcome challenger" subtitle="It's time to lock in">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Main Login Card */}
        {!thirdWebAccount ? (
          <ThematicContainer
            color="nocenaBlue"
            glassmorphic={true}
            asButton={false}
            rounded="2xl"
            className="p-8 text-center"
          >
            <h3 className="text-xl font-bold text-white mb-2">Connect Your Account</h3>
            <p className="text-sm text-gray-300 mb-6">Sign in with your wallet or social account</p>

            <ConnectButton
              client={client}
              chain={chain}
              wallets={wallets}
              theme="dark"
              connectModal={{
                title: 'Connect to Nocena',
                titleIcon: '/logo/LogoDark.png',
              }}
            />
          </ThematicContainer>
        ) : (
          <div className="space-y-6">
            {loading || meQueryLoading ? (
              <ThematicContainer
                color="nocenaPink"
                glassmorphic={true}
                asButton={false}
                rounded="2xl"
                className="p-8 text-center"
              >
                <div className="w-16 h-16 border-4 border-nocenaPink/20 border-t-nocenaPink rounded-full animate-spin mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Checking Profile</h3>
                <p className="text-sm text-gray-300 mb-4">Verifying your account details...</p>
                <div className="bg-black/30 rounded-lg px-3 py-2 inline-block">
                  <span className="text-xs font-mono text-gray-400">
                    {thirdWebAccount.address.slice(0, 8)}...{thirdWebAccount.address.slice(-6)}
                  </span>
                </div>
              </ThematicContainer>
            ) : walletChecked && !error ? (
              <ThematicContainer
                color="nocenaPurple"
                glassmorphic={true}
                asButton={false}
                rounded="2xl"
                className="p-8 text-center"
              >
                <h3 className="text-xl font-bold text-white mb-2">Profile Connected</h3>
                <p className="text-sm text-gray-300 mb-4">Successfully verified your account</p>

                <div className="bg-black/30 rounded-lg px-3 py-2 inline-block mb-6">
                  <span className="text-xs font-mono text-gray-400">
                    {thirdWebAccount.address.slice(0, 8)}...{thirdWebAccount.address.slice(-6)}
                  </span>
                </div>

                <ConnectButton
                  client={client}
                  chain={chain}
                  wallets={wallets}
                  theme="dark"
                  connectModal={{
                    title: 'Connect to Nocena',
                    titleIcon: '/logo/LogoDark.png',
                  }}
                />
              </ThematicContainer>
            ) : (
              <ThematicContainer
                color="nocenaBlue"
                glassmorphic={true}
                asButton={false}
                rounded="2xl"
                className="p-8 pb-4 text-center"
              >
                <h3 className="text-xl font-bold text-white mb-2">Wallet Connected</h3>
                <p className="text-sm text-gray-300 mb-4">Checking your profile status...</p>

                <div className="bg-black/30 rounded-lg px-3 py-2 inline-block mb-6">
                  <span className="text-xs font-mono text-gray-400">
                    {thirdWebAccount.address.slice(0, 8)}...{thirdWebAccount.address.slice(-6)}
                  </span>
                </div>

                <ConnectButton
                  client={client}
                  chain={chain}
                  wallets={wallets}
                  theme="dark"
                  connectModal={{
                    title: 'Connect to Nocena',
                    titleIcon: '/logo/LogoDark.png',
                  }}
                />

                <div className="w-full flex justify-center align-items-center">
                  <button
                    className="flex items-center space-x-1 text-sm underline"
                    onClick={() => disconnect?.(activeWallet!)}
                    type="reset"
                  >
                    <div>Change wallet</div>
                  </button>
                </div>
              </ThematicContainer>
            )}
          </div>
        )}

        {thirdWebAccount && !loading && !meQueryLoading && <Login />}

        {/* Registration Link */}
        <RegistrationLinkSection error={error} />
      </div>
    </AuthenticationLayout>
  );
};

export default LoginPage;
