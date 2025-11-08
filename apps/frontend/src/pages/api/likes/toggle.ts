// pages/api/likes/toggle.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { toggleCompletionLike } from '../../../lib/graphql';
import { SocialRewardsService } from '../../../lib/contracts/socialRewards';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { completionId, userId } = req.body;

    // Validate required fields
    if (!completionId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['completionId', 'userId'],
      });
    }

    // Validate field types
    if (typeof completionId !== 'string' || typeof userId !== 'string') {
      return res.status(400).json({
        error: 'Invalid field types',
        details: 'completionId and userId must be strings',
      });
    }

    console.log(`API: Toggling like for completion ${completionId} by user ${userId}`);

    // Toggle the like in the database
    const result = await toggleCompletionLike(userId, completionId);

    console.log(`API: Like toggle successful:`, result);

    // Mint social reward if liked (not unliked)
    let rewardInfo = null;
    if (result.isLiked) {
      try {
        const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
        if (relayerPrivateKey) {
          console.log('🎉 Processing like reward for:', userId);
          const service = new SocialRewardsService(relayerPrivateKey);
          const txHash = await service.processLike(userId, completionId);
          console.log('✅ Like reward minted:', txHash);
          
          rewardInfo = {
            success: true,
            txHash,
            message: 'Like reward minted successfully! +2 NCT earned'
          };
        }
      } catch (error) {
        console.error('Failed to process social reward:', error);
      }
    }

    return res.status(200).json({
      success: true,
      isLiked: result.isLiked,
      newLikeCount: result.newLikeCount,
      message: result.isLiked ? 'Post liked' : 'Post unliked',
      reward: rewardInfo
    });
  } catch (error) {
    console.error('API: Error toggling like:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Handle specific error cases
    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        error: 'Challenge completion not found',
        details: errorMessage,
      });
    }

    if (errorMessage.includes('Failed to check') || errorMessage.includes('Failed to update')) {
      return res.status(500).json({
        error: 'Database operation failed',
        details: errorMessage,
      });
    }

    return res.status(500).json({
      error: 'Failed to toggle like',
      details: errorMessage,
    });
  }
}
