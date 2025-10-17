import React, { useState } from 'react';
import { Wallet, Shield, Zap, Smartphone, Users, Copy } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useActiveAccount } from 'thirdweb/react';
import { ConnectButton } from 'thirdweb/react';
import { client, flowChain } from '../../../lib/thirdweb';
import { wallets } from '../../../lib/thirdweb/wallets';
import { useNoceniteToken } from '../../../hooks/contracts/useNoceniteToken';
import { CONTRACTS } from '../../../lib/constants';

interface WalletMenuProps {
  onBack: () => void;
}

const WalletMenu: React.FC<WalletMenuProps> = ({ onBack }) => {
  const { user } = useAuth();
  const account = useActiveAccount();
  const nctBalance = useNoceniteToken();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Use the correct NCT contract address from constants
  const NCT_ADDRESS = CONTRACTS.Nocenite;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="p-6">
      <div
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        className="flex items-center text-white/70 hover:text-white mb-6 transition-colors cursor-pointer select-none"
        role="button"
        tabIndex={0}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="mr-2"
        >
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Back to Menu
      </div>

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-nocenaBlue rounded-xl flex items-center justify-center">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-white text-2xl font-bold">Your Wallet</h2>
          <p className="text-white/60 text-sm">Secure and simple</p>
        </div>
      </div>

      {/* Wallet Connection */}
      {!account && (
        <div className="bg-gradient-to-br from-nocenaPink/20 to-nocenaBlue/20 rounded-2xl p-6 mb-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4 text-center text-lg">Connect Your Wallet</h3>
          <p className="text-white/70 text-sm text-center mb-6">
            Connect your wallet to view your blockchain balance and manage your NCT tokens
          </p>
          <div className="flex justify-center">
            <ConnectButton
              client={client}
              chain={flowChain}
              wallets={wallets}
              theme="dark"
              connectModal={{
                title: 'Connect to Nocena',
                titleIcon: '/logo/LogoDark.png',
              }}
            />
          </div>
        </div>
      )}

      {/* Current Balance */}
      <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
        <h3 className="text-white font-semibold mb-4 text-center text-lg">
          Your Blockchain Balance
        </h3>
        {account?.address ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-left flex-1">
                <div className="text-2xl font-bold text-green-400">
                  {parseFloat(nctBalance.formatted).toFixed(0)} NCT
                </div>
                <div className="text-white/50 text-sm">Reward Tokens</div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-white/40 text-xs font-mono">
                    {NCT_ADDRESS.slice(0, 6)}...{NCT_ADDRESS.slice(-4)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(NCT_ADDRESS, 'NCT')}
                    className="text-white/40 hover:text-white/60 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {copiedAddress === 'NCT' && (
                    <span className="text-green-400 text-xs">Copied!</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-center pt-2 border-t border-white/10">
              <div className="text-white/60 text-xs flex items-center justify-center space-x-2">
                <span>
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </span>
                <button
                  onClick={() => copyToClipboard(account.address, 'wallet')}
                  className="text-white/40 hover:text-white/60 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {copiedAddress === 'wallet' && (
                  <span className="text-green-400 text-xs">Copied!</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-2xl font-bold text-white/50 mb-2">Connect Wallet</div>
            <div className="text-white/40 text-sm">Connect to view blockchain balances</div>
          </div>
        )}
      </div>

      {/* What is a Wallet */}
      <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
        <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
          <Shield className="w-5 h-5 mr-3 text-nocenaPink" />
          Your Digital Wallet
        </h3>
        <p className="text-white/70 text-sm leading-relaxed mb-4">
          Think of your wallet like a secure digital account that holds your Nocenite tokens. Just
          like your email or social media account, it's protected and belongs to you.
        </p>
        <p className="text-white/70 text-sm leading-relaxed">
          Connect popular wallets like MetaMask, Coinbase Wallet, or use our built-in social login
          options to get started.
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
        <h3 className="text-white font-semibold mb-4 text-lg">How It Works</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 bg-nocenaBlue/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-nocenaBlue" />
            </div>
            <div>
              <div className="text-white font-medium text-sm">Instant & Free</div>
              <div className="text-white/50 text-xs">
                No transaction fees for earning or using tokens
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 bg-nocenaPink/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-nocenaPink" />
            </div>
            <div>
              <div className="text-white font-medium text-sm">Automatically Secure</div>
              <div className="text-white/50 text-xs">
                Protected by advanced encryption technology
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 bg-nocenaPurple/20 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-nocenaPurple" />
            </div>
            <div>
              <div className="text-white font-medium text-sm">Multiple Options</div>
              <div className="text-white/50 text-xs">
                MetaMask, social login, or built-in wallet
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Easy Setup */}
      <div className="bg-gradient-to-r from-nocenaPink/10 to-nocenaBlue/10 rounded-2xl p-6 mb-6 border border-nocenaPink/20">
        <h3 className="text-white font-semibold mb-4 flex items-center text-lg">
          <Users className="w-5 h-5 mr-3 text-nocenaPink" />
          Made for Everyone
        </h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-nocenaPink rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-white/70 text-sm">
              <strong className="text-white">Multiple Options:</strong> Use MetaMask, Coinbase
              Wallet, or sign up with email/social
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-nocenaBlue rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-white/70 text-sm">
              <strong className="text-white">No Hidden Fees:</strong> Earning, sending, and
              receiving tokens is completely free
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-nocenaPurple rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-white/70 text-sm">
              <strong className="text-white">Beginner Friendly:</strong> Social login makes it easy
              for anyone to start
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-4 text-lg">Coming Soon</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 text-sm text-white/60">
            <div className="w-2 h-2 bg-nocenaPink rounded-full"></div>
            <span>Send tokens to friends</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-white/60">
            <div className="w-2 h-2 bg-nocenaBlue rounded-full"></div>
            <span>Transaction history and receipts</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-white/60">
            <div className="w-2 h-2 bg-nocenaPurple rounded-full"></div>
            <span>Export your wallet to other apps</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-white/60">
            <div className="w-2 h-2 bg-nocenaPink rounded-full"></div>
            <span>Reward marketplace for exclusive items</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletMenu;
