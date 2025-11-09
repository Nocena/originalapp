import { NextApiRequest, NextApiResponse } from 'next';
import { SocialRewardsService } from '../../../lib/contracts/socialRewards';

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
const FLOW_RPC_URL = 'https://testnet.evm.nodes.onflow.org';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, interactionType, targetId } = req.body;

    if (!userAddress || !interactionType || !targetId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const service = new SocialRewardsService(RELAYER_PRIVATE_KEY, FLOW_RPC_URL);
    const amount = service.getRewardAmount(interactionType);
    const interactionId = service.generateInteractionId(userAddress, interactionType, targetId);

    const interaction = {
      user: userAddress,
      amount,
      interactionId,
      type: interactionType
    };

    const tx = await service.processBatch([interaction]);
    
    return res.status(200).json({
      success: true,
      transactionHash: tx.hash,
      rewardAmount: interactionType === 'like' ? '2' : interactionType === 'reaction' ? '5' : '10',
      interactionId
    });

  } catch (error) {
    console.error('Social rewards error:', error);
    return res.status(500).json({ error: 'Failed to process social reward' });
  }
}
