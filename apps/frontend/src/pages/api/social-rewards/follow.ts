import { NextApiRequest, NextApiResponse } from 'next';
import { SocialRewardsService } from '../../../lib/contracts/socialRewards';
import { getLensAccountByAddress } from '../../../lib/lens/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { followedAccountAddress } = req.body;

    if (!followedAccountAddress) {
      return res.status(400).json({ error: 'Missing followedAccountAddress' });
    }

    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      return res.status(500).json({ error: 'Relayer private key not configured' });
    }

    // Get followed user's wallet address from Lens account
    const lensAccountData = await getLensAccountByAddress(followedAccountAddress);
    const followedUserWallet = lensAccountData?.account?.owner;

    if (!followedUserWallet) {
      return res.status(404).json({ error: 'Followed user wallet not found' });
    }

    console.log('🎉 Processing follow reward for followed user wallet:', followedUserWallet);

    const service = new SocialRewardsService(relayerPrivateKey);
    const txHash = await service.processFollow(followedUserWallet, followedAccountAddress);
    
    console.log('✅ Follow reward minted:', txHash);

    return res.status(200).json({
      success: true,
      txHash,
      message: 'Follow reward minted successfully! +10 NCT earned'
    });

  } catch (error) {
    console.error('Follow reward error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
