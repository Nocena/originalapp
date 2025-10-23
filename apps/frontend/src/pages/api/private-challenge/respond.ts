/**
 * Respond to Private Challenge API
 *
 * Accept or reject a private challenge.
 * Currently uses mock database.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { privateChallengeDb } from '../../../lib/api/mockPrivateChallengeDb';

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

    const status = action === 'accept' ? 'accepted' : 'rejected';
    const success = await privateChallengeDb.updateChallengeStatus(challengeId, status);

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
