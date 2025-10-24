/**
 * Private Challenge Creation API
 *
 * Creates a new private challenge between users using real database.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { CreatePrivateChallengeRequest } from '../../../types/notifications';
import { createPrivateChallenge, getUserFromDgraph } from '../../../lib/api/dgraph';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 Received private challenge request:', req.body);

    const {
      recipientId,
      name,
      description,
      rewardAmount,
      creatorId,
      creatorUsername,
    }: CreatePrivateChallengeRequest & {
      creatorId: string;
      creatorUsername: string;
    } = req.body;

    // Basic validation
    if (!recipientId || !name || !description || !rewardAmount || !creatorId || !creatorUsername) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rewardAmount > 250) {
      return res.status(400).json({ error: 'Reward amount cannot exceed 250 tokens' });
    }

    // Prevent sending challenges to yourself
    if (creatorId === recipientId) {
      return res.status(400).json({ error: 'Cannot send challenge to yourself' });
    }

    // Look up actual user IDs from wallet addresses
    const creatorUser = await getUserFromDgraph(creatorId);
    const recipientUser = await getUserFromDgraph(recipientId);

    if (!creatorUser || !recipientUser) {
      return res.status(400).json({ error: 'Invalid user addresses' });
    }

    // Create challenge in real database with actual user IDs
    const challengeId = await createPrivateChallenge(
      creatorUser.id,
      recipientUser.id,
      name,
      description,
      rewardAmount,
      1 // 1 day expiration
    );

    console.log('✅ Private challenge created:', challengeId);

    res.status(201).json({
      success: true,
      challengeId,
      message: 'Private challenge created successfully',
    });
  } catch (error) {
    console.error('Error creating private challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
