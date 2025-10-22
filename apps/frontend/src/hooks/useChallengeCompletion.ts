import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useAuth } from '../contexts/AuthContext';
import { useIsRewardMinter } from './contracts/useNocenite';
import {
  completeChallengeWorkflow,
  type CompletionData,
  type CompletionResult,
} from '../lib/completing/challengeCompletionService';

interface BlockchainCompletionResult extends CompletionResult {
  blockchainReward?: {
    success: boolean;
    txHash?: string;
    rewardAmount: number;
    error?: string;
  };
}

export function useChallengeCompletion() {
  const [isCompleting, setIsCompleting] = useState(false);
  const { currentLensAccount } = useAuth();
  const account = useActiveAccount();
  const { data: isRewardMinter } = useIsRewardMinter(account?.address);

  const completeChallenge = async (
    completionData: CompletionData,
    enableBlockchainRewards: boolean = true
  ): Promise<BlockchainCompletionResult> => {
    if (!currentLensAccount) {
      return { success: false, message: 'User not authenticated' };
    }

    setIsCompleting(true);

    try {
      // Pass the user's wallet address to the completion workflow
      const completionResult = await completeChallengeWorkflow(
        currentLensAccount.address,
        completionData,
        account?.address // This ensures tokens are minted to the connected wallet
      );

      return completionResult;
    } catch (error) {
      console.error('❌ Challenge completion failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    completeChallenge,
    isCompleting,
    canMintTokens: !!account?.address && !!isRewardMinter,
    userAddress: account?.address,
    isRewardMinter,
    isWalletConnected: !!account?.address,
  };
}
