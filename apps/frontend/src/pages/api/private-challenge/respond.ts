import { NextApiRequest, NextApiResponse } from 'next';
import { privateChallengeDb } from '../../../lib/api/mockPrivateChallengeDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { challengeId, action, userId } = req.body;

    // Basic validation
    if (!challengeId || !action || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (action !== 'accept' && action !== 'reject') {
      return res.status(400).json({ error: 'Action must be accept or reject' });
    }

    // Get the challenge to verify it exists and user is the recipient
    const challenge = await privateChallengeDb.getChallenge(challengeId);
    
    console.log('Challenge lookup:', { challengeId, challenge, userId });
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (challenge.recipientId !== userId) {
      return res.status(403).json({ error: 'Not authorized to respond to this challenge' });
    }

    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: 'Challenge has already been responded to' });
    }

    // Update challenge status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const updated = await privateChallengeDb.updateChallengeStatus(challengeId, newStatus);

    if (!updated) {
      return res.status(500).json({ error: 'Failed to update challenge status' });
    }

    // If rejected, notify creator (simple console log for now)
    if (action === 'reject') {
      console.log(`📧 Notification: Challenge "${challenge.name}" was rejected by recipient`);
      console.log(`   Creator: ${challenge.creatorUsername} (${challenge.creatorId})`);
      console.log(`   Recipient: ${userId}`);
      // TODO: Send actual notification to creator
      // TODO: Return daily challenge quota to creator
    }

    res.status(200).json({
      success: true,
      action,
      challengeId,
      message: `Challenge ${action}ed successfully`
    });

  } catch (error) {
    console.error('Error responding to private challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
