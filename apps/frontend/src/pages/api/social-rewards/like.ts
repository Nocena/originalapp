import { NextApiRequest, NextApiResponse } from 'next';
import { SocialRewardsService } from '../../../lib/contracts/socialRewards';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress, completionId, interactionType } = req.body;

    if (!userAddress || !completionId || !interactionType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get relayer private key from environment
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      return res.status(500).json({ error: 'Relayer private key not configured' });
    }

    console.log('🎉 Processing like reward for:', userAddress);

    const service = new SocialRewardsService(relayerPrivateKey);
    const txHash = await service.processLike(userAddress, completionId);
    
    console.log('✅ Like reward minted:', txHash);

    return res.status(200).json({
      success: true,
      txHash,
      message: 'Like reward minted successfully! +2 NCT earned'
    });

  } catch (error) {
    console.error('Like reward error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
