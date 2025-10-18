import { NextApiRequest, NextApiResponse } from 'next';
import { privateChallengeDb } from '../../../lib/api/mockPrivateChallengeDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get all challenges created by this user
    const sentChallenges = await privateChallengeDb.getChallengesByCreator(userId);
    
    // Filter only final statuses that can be cleared (not pending or accepted)
    const clearableStatuses = ['completed', 'rejected', 'expired', 'failed'];
    const completedChallenges = sentChallenges.filter(
      challenge => clearableStatuses.includes(challenge.status)
    );

    // Mark completed challenges as cleared (they won't show in sent list anymore)
    let clearedCount = 0;
    for (const challenge of completedChallenges) {
      const updated = await privateChallengeDb.updateChallengeStatus(challenge.id, 'cleared' as any);
      if (updated) clearedCount++;
    }

    res.status(200).json({
      success: true,
      clearedCount,
      message: `Cleared ${clearedCount} completed challenges`
    });

  } catch (error) {
    console.error('Error clearing challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
