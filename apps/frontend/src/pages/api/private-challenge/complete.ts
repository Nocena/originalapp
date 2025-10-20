import { NextApiRequest, NextApiResponse } from 'next';
import { privateChallengeDb } from '../../../lib/api/mockPrivateChallengeDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { challengeId, userId } = req.body;

    if (!challengeId || !userId) {
      return res.status(400).json({ error: 'Missing required fields: challengeId, userId' });
    }

    // Get the challenge to verify it exists and user is the recipient
    const challenge = await privateChallengeDb.getChallenge(challengeId);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (challenge.recipientId !== userId) {
      return res.status(403).json({ error: 'Not authorized to complete this challenge' });
    }

    if (challenge.status !== 'accepted' && challenge.status !== 'pending') {
      return res.status(400).json({ error: 'Challenge cannot be completed from current status' });
    }

    // Update challenge status to completed
    const updated = await privateChallengeDb.updateChallengeStatus(challengeId, 'completed');

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update challenge status' });
    }

    console.log(`✅ Private challenge completed: ${challengeId} by user ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Challenge marked as completed',
      challengeId,
    });

  } catch (error) {
    console.error('Error completing private challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
