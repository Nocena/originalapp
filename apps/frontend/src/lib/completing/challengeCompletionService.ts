// Simplified challenge completion service for monorepo
import { createChallengeCompletion } from '../graphql';
import { uploadBlob } from '../../helpers/accountPictureUtils';
import { getVideoSnapshot } from '../../helpers/getVideoSnapshot';

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
    creatorWalletAddress?: string;
  };
}

export interface CompletionResult {
  success: boolean;
  message: string;
  completionId?: string;
  nftReward?: {
    status: string;
    [key: string]: any;
  };
}

export async function completeChallengeWorkflow(
  userId: string,
  completionData: CompletionData,
  userWalletAddress?: string,
): Promise<CompletionResult> {
  try {
    console.log('🔍 DEBUG: Function inputs:', {
      userId,
      completionData,
      userWalletAddress,
      challengeType: completionData?.challenge?.type,
      challengeFrequency: completionData?.challenge?.frequency,
      challengeId: completionData?.challenge?.challengeId,
      creatorWalletAddress: completionData?.challenge?.creatorWalletAddress,
    });

    const {
      challenge,
      video,
      photo,
      description,
      verificationResult,
    } = completionData;

    console.log('Starting challenge completion workflow for user:', userId);
    console.log('Challenge type:', challenge.type, 'Frequency:', challenge.frequency);
    console.log('User wallet address:', userWalletAddress);

    // Step 1: Mint blockchain NCT tokens based on challenge type
    if (userWalletAddress) {
      try {
        console.log('🔗 Minting blockchain NCT tokens...');

        let mintPayload;

        if (challenge.type === 'AI' && challenge.frequency) {
          // AI challenges with frequency (existing logic)
          mintPayload = {
            userAddress: userWalletAddress,
            challengeFrequency: challenge.frequency,
            ipfsHash: 'challenge-completion',
          };
        } else if (challenge.type === 'PUBLIC' && challenge.challengeId) {
          // PUBLIC challenges - variable reward amount
          mintPayload = {
            userAddress: userWalletAddress,
            challengeType: 'PUBLIC',
            recipientReward: challenge.reward,
            ipfsHash: challenge.challengeId,
          };
        } else if (
          challenge.type === 'PRIVATE' &&
          challenge.challengeId &&
          challenge.creatorWalletAddress
        ) {
          // Private challenges - mint to both recipient and creator
          const creatorReward = Math.floor(challenge.reward * 0.1); // 10% to creator

          mintPayload = {
            userAddress: userWalletAddress,
            challengeType: 'PRIVATE',
            challengeId: challenge.challengeId,
            creatorAddress: challenge.creatorWalletAddress,
            recipientReward: challenge.reward,
            creatorReward: creatorReward,
            ipfsHash: challenge.challengeId, // Use unique challengeId for testing
          };
        } else {
          // Skip token minting for other challenge types or missing data
          return {
            success: true,
            message: `Challenge completed! +${challenge.reward} tokens earned`,
            completionId: 'mock-completion-id',
          };
        }

        console.log('🔗 Mint payload:', mintPayload);
        
        const mintResponse = await fetch('/api/mint-challenge-reward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mintPayload),
        });

        console.log('🔗 Mint API response status:', mintResponse.status);
        const mintResult = await mintResponse.json();
        console.log('🔗 Mint API result:', mintResult);
        
        if (mintResult.success) {
          console.log(`✅ Blockchain NCT tokens minted: ${mintResult.txHash}`);

          // Mark private challenge as completed if applicable
          if (challenge.type === 'PRIVATE' && challenge.challengeId) {
            try {
              console.log('🏁 Marking private challenge as completed...');
              const completeResponse = await fetch('/api/private-challenge/complete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  challengeId: challenge.challengeId,
                  userId: userId,
                }),
              });

              const completeResult = await completeResponse.json();
              if (completeResult.success) {
                console.log('✅ Private challenge marked as completed');
              } else {
                console.error(
                  '❌ Failed to mark private challenge as completed:',
                  completeResult.error,
                );
              }
            } catch (error) {
              console.error('❌ Error marking private challenge as completed:', error);
            }
          }

          // Trigger challenge replacement for PUBLIC challenges
          if (challenge.type === 'PUBLIC' && challenge.challengeId) {
            try {
              console.log('🔄 Triggering PUBLIC challenge replacement...');
              // Dispatch custom event to notify map to refresh challenges
              window.dispatchEvent(new CustomEvent('challengeCompleted', {
                detail: { challengeId: challenge.challengeId, userId }
              }));
            } catch (error) {
              console.error('❌ Error triggering challenge replacement:', error);
            }
          }

          let completionId = 'mock-completion-id';
          
          if (challenge.challengeId) {
            // Check if this is dev mode (mock blobs)
            const isDevMode = video.size <= 20 && photo.size <= 20; // Mock blobs are tiny
            
            if (isDevMode) {
              console.log('🧪 Dev mode detected - skipping database record');
              completionId = `dev-${Date.now()}`;
            } else {
              try {
                console.log('📁 Uploading blobs to IPFS...');
                const videoCID = await uploadBlob(video, 'video');
                const selfieCID = await uploadBlob(photo, 'photo');
                const snapshotBlob = await getVideoSnapshot(video, 0); // first frame
                const previewCID = await uploadBlob(snapshotBlob, 'photo');

                const timestamp = Date.now();
                console.log('💾 Creating completion record...');
                completionId = await createChallengeCompletion(
                  userId,
                  challenge.type.toLowerCase() as 'private' | 'public' | 'ai',
                  JSON.stringify({
                    videoCID,
                    selfieCID,
                    previewCID,
                    timestamp,
                    description,
                    verificationResult,
                    hasVideo: true,
                    hasSelfie: true,
                    hasPreview: true,
                    videoFileName: `challenge_video_${userId}_${timestamp}.webm`,
                    selfieFileName: `challenge_selfie_${userId}_${timestamp}.jpg`,
                  }),
                  challenge.challengeId,
                );
                console.log('✅ Completion record created');
              } catch (error) {
                console.error('❌ Completion record failed:', error);
                // Don't fail - tokens already minted
                completionId = `fallback-${Date.now()}`;
              }
            }
          }

          return {
            success: true,
            message: `Challenge completed! +${challenge.reward} NCT tokens minted to your wallet!`,
            completionId,
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
    } else {
      console.log('❌ No wallet address provided, skipping blockchain minting');
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
