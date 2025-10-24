/**
 * Complete Private Challenge API
 *
 * Mark a challenge as completed using real database.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { updatePrivateChallengeStatus } from '../../../lib/api/dgraph';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { challengeId } = req.body;

    if (!challengeId) {
      return res.status(400).json({ error: 'Challenge ID is required' });
    }

    const success = await updatePrivateChallengeStatus(challengeId, false, true);

    if (!success) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Challenge completed successfully',
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
