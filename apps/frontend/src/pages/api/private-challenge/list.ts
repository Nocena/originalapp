import { NextApiRequest, NextApiResponse } from 'next';
import { privateChallengeDb } from '../../../lib/api/mockPrivateChallengeDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch challenges where user is the recipient
    const challenges = await privateChallengeDb.getChallengesByRecipient(userId);

    res.status(200).json({
      success: true,
      challenges
    });

  } catch (error) {
    console.error('Error fetching private challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
