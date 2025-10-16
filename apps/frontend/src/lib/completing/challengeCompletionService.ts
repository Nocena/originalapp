// Simplified challenge completion service for monorepo
export interface CompletionData {
  video: Blob;
  photo: Blob;
  verificationResult: any;
  description: string;
  challenge: {
    title: string;
    description: string;
    reward: number;
    type: 'AI' | 'PRIVATE' | 'PUBLIC';
    frequency?: 'daily' | 'weekly' | 'monthly';
    challengeId?: string;
    creatorId?: string;
  };
}

export interface CompletionResult {
  success: boolean;
  message: string;
  completionId?: string;
}

export async function completeChallengeWorkflow(
  userId: string,
  completionData: CompletionData,
  userWalletAddress?: string,
): Promise<CompletionResult> {
  try {
    const { challenge } = completionData;

    console.log('Starting challenge completion workflow for user:', userId);
    console.log('Challenge type:', challenge.type, 'Frequency:', challenge.frequency);

    // Step 1: Mint blockchain NCT tokens if it's an AI challenge with frequency and user has wallet
    if (challenge.type === 'AI' && challenge.frequency && userWalletAddress) {
      try {
        console.log('🔗 Minting blockchain NCT tokens...');
        const mintResponse = await fetch('/api/mint-challenge-reward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAddress: userWalletAddress,
            challengeFrequency: challenge.frequency,
            ipfsHash: 'challenge-completion',
          }),
        });

        const mintResult = await mintResponse.json();
        if (mintResult.success) {
          console.log(`✅ Blockchain NCT tokens minted: ${mintResult.txHash}`);
          return {
            success: true,
            message: `Challenge completed! +${challenge.reward} NCT tokens minted to your wallet!`,
            completionId: 'mock-completion-id',
          };
        } else {
          console.error('❌ Blockchain minting failed:', mintResult.error);
          return {
            success: false,
            message: `Challenge completion failed: ${mintResult.error}`,
          };
        }
      } catch (error) {
        console.error('❌ Blockchain minting error:', error);
        return {
          success: false,
          message: 'Challenge completion failed: Blockchain error',
        };
      }
    }

    // For non-AI challenges or challenges without wallet
    return {
      success: true,
      message: `Challenge completed! +${challenge.reward} tokens earned`,
      completionId: 'mock-completion-id',
    };

  } catch (error) {
    console.error('Challenge completion failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Challenge completion failed',
    };
  }
}
