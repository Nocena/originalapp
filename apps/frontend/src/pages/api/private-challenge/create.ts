/**
 * Private Challenge Creation API
 *
 * Creates a new private challenge between users.
 * Currently uses mock database - will migrate to Dgraph when schema is deployed.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { CreatePrivateChallengeRequest } from '../../../types/notifications';
import { privateChallengeDb } from '../../../lib/api/mockPrivateChallengeDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 Received private challenge request:', req.body);

    const {
      recipientId,
      recipientWalletAddress,
      name,
      description,
      rewardAmount,
      creatorId,
      creatorWalletAddress,
      creatorUsername,
      creatorProfilePicture,
      recipientUsername,
    }: CreatePrivateChallengeRequest & {
      creatorId: string;
      creatorWalletAddress: string;
      creatorUsername: string;
      creatorProfilePicture?: string;
      recipientUsername: string;
    } = req.body;

    // Basic validation
    if (
      !recipientId ||
      !recipientWalletAddress ||
      !name ||
      !description ||
      !rewardAmount ||
      !creatorId ||
      !creatorWalletAddress ||
      !creatorUsername
    ) {
      console.error('❌ Missing required fields:', {
        recipientId: !!recipientId,
        recipientWalletAddress: !!recipientWalletAddress,
        name: !!name,
        description: !!description,
        rewardAmount: !!rewardAmount,
        creatorId: !!creatorId,
        creatorWalletAddress: !!creatorWalletAddress,
        creatorUsername: !!creatorUsername,
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rewardAmount > 250) {
      return res.status(400).json({ error: 'Reward amount cannot exceed 250 tokens' });
    }

    // Prevent sending challenges to yourself
    if (creatorId === recipientId) {
      return res.status(400).json({ error: 'Cannot send challenge to yourself' });
    }

    // Create challenge in mock DB with 24-hour expiration
    const challenge = await privateChallengeDb.createChallenge({
      name,
      description,
      rewardAmount,
      creatorId,
      creatorWalletAddress,
      creatorUsername,
      creatorProfilePicture: creatorProfilePicture || '/images/profile.png',
      recipientId,
      recipientWalletAddress,
      recipientUsername,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });

    console.log('✅ Private challenge created:', challenge.id);

    // TODO: Create notification when Dgraph is properly set up

    res.status(201).json({
      success: true,
      challengeId: challenge.id,
      message: 'Private challenge created successfully',
    });
  } catch (error) {
    console.error('Error creating private challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
