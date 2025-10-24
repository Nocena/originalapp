/**
 * Respond to Private Challenge API
 *
 * Accept or reject a private challenge using real database.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { updatePrivateChallengeStatus } from '../../../lib/api/dgraph';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { challengeId, action } = req.body;

    if (!challengeId || !action) {
      return res.status(400).json({ error: 'Challenge ID and action are required' });
    }

    if (action !== 'accept' && action !== 'reject') {
      return res.status(400).json({ error: 'Action must be "accept" or "reject"' });
    }

    // Update challenge status based on action
    const isActive = action === 'accept';
    const isCompleted = false; // Not completed yet, just accepted/rejected

    const success = await updatePrivateChallengeStatus(challengeId, isActive, isCompleted);

    if (!success) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.status(200).json({
      success: true,
      message: `Challenge ${action}ed successfully`,
    });
  } catch (error) {
    console.error('Error responding to challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
