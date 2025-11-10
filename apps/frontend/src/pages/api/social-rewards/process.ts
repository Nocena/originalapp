import { NextApiRequest, NextApiResponse } from 'next';
import { SocialRewardsService } from '../../../lib/contracts/socialRewards';

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, interactionType, targetId } = req.body;

    if (!userAddress || !interactionType || !targetId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const service = new SocialRewardsService(RELAYER_PRIVATE_KEY);

    let txHash: string;
    let rewardAmount: string;

    // Call the correct function depending on interaction type
    switch (interactionType) {
      case 'like':
        txHash = await service.processLike(userAddress, targetId);
        rewardAmount = '2';
        break;
      case 'reaction':
        txHash = await service.processReaction(userAddress, targetId);
        rewardAmount = '5';
        break;
      case 'follow':
        txHash = await service.processFollow(userAddress, targetId);
        rewardAmount = '10';
        break;
      default:
        return res.status(400).json({ error: 'Invalid interaction type' });
    }

    return res.status(200).json({
      success: true,
      transactionHash: txHash,
      rewardAmount,
      interactionType,
    });
  } catch (error) {
    console.error('Social rewards error:', error);
    return res.status(500).json({ error: 'Failed to process social reward' });
  }
}
