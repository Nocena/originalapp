/**
 * Clear Completed Challenges API
 *
 * Remove completed/rejected challenges from view.
 * Currently uses mock database.
 */

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

    const clearedCount = await privateChallengeDb.clearCompletedChallenges(userId);

    res.status(200).json({
      success: true,
      clearedCount,
      message: `Cleared ${clearedCount} completed challenges`,
    });
  } catch (error) {
    console.error('Error clearing challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
