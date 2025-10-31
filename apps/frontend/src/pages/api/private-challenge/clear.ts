/**
 * Clear Completed Challenges API
 *
 * Remove completed/rejected challenges from view using real database.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import {
  deletePrivateChallenge,
  getPrivateChallengesByRecipient,
  getPrivateChallengesByCreator,
} from '../../../lib/api/dgraph';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get all challenges for this user (both received and created)
    const [receivedChallenges, createdChallenges] = await Promise.all([
      getPrivateChallengesByRecipient(userId),
      getPrivateChallengesByCreator(userId),
    ]);

    const allChallenges = [...receivedChallenges, ...createdChallenges];

    // Filter completed and expired challenges
    const challengesToClear = allChallenges.filter(
      (challenge) =>
        challenge.isCompleted ||
        !challenge.isActive ||
        (challenge.expiresAt && new Date(challenge.expiresAt) < new Date())
    );

    // Delete completed and expired challenges
    let clearedCount = 0;
    for (const challenge of challengesToClear) {
      const success = await deletePrivateChallenge(challenge.id);
      if (success) clearedCount++;
    }

    res.status(200).json({
      success: true,
      clearedCount,
      message: `Cleared ${clearedCount} completed and expired challenges`,
    });
  } catch (error) {
    console.error('Error clearing challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
