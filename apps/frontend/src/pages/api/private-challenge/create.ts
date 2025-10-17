import { NextApiRequest, NextApiResponse } from 'next';
import { CreatePrivateChallengeRequest } from '../../../types/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipientId, name, description, rewardAmount }: CreatePrivateChallengeRequest = req.body;

    // Basic validation
    if (!recipientId || !name || !description || !rewardAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rewardAmount > 250) {
      return res.status(400).json({ error: 'Reward amount cannot exceed 250 tokens' });
    }

    // TODO: Get creator ID from auth/session
    const creatorId = 'temp-creator-id';

    // TODO: Check daily limit (3 challenges per day)
    
    // TODO: Create challenge in database
    const challengeId = `challenge-${Date.now()}`;

    // TODO: Send notification to recipient

    res.status(201).json({
      success: true,
      challengeId,
      message: 'Private challenge created successfully'
    });

  } catch (error) {
    console.error('Error creating private challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
