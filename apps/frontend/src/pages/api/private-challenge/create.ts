/**
 * Private Challenge Creation API
 *
 * Creates a new private challenge between users using Lens accounts.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { CreatePrivateChallengeRequest } from '../../../types/notifications';
import { createPrivateChallenge } from '../../../lib/api/dgraph';
import { lensApolloClient } from '../../_app';
import { AccountDocument, AccountQuery, AccountQueryVariables } from '@nocena/indexer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      recipientId,
      name,
      description,
      rewardAmount,
      creatorId,
      creatorUsername,
      isSponsored,
      sponsorMetadata,
    }: CreatePrivateChallengeRequest & {
      creatorId: string;
      creatorUsername: string;
    } = req.body;

    // Handle sponsored challenges
    if (isSponsored && sponsorMetadata) {
      const challengeId = await createPrivateChallenge(
        creatorId,
        'sponsored', // Special recipient for sponsored challenges
        `${sponsorMetadata.sponsorName}: ${name}`,
        `Sponsored by ${sponsorMetadata.sponsorName} - ${sponsorMetadata.sponsorDescription}\n\n${description}`,
        rewardAmount || 100,
        1 // 1 day expiration for sponsored challenges
      );

      return res.status(200).json({
        success: true,
        challengeId,
        message: 'Sponsored challenge created successfully',
      });
    }

    // Basic validation for regular private challenges
    if (!recipientId || !name || !description || !rewardAmount || !creatorId || !creatorUsername) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rewardAmount > 250) {
      return res.status(400).json({ error: 'Reward amount cannot exceed 250 tokens' });
    }

    // Handle invite link creation (no specific recipient)
    if (recipientId === 'invite') {
      const challengeId = await createPrivateChallenge(
        creatorId,
        'invite-link', // Special recipient for invite links
        name,
        description,
        rewardAmount,
        7 // 7 days expiration for invite links
      );

      return res.status(201).json({
        success: true,
        challengeId,
        message: 'Invite link created successfully',
        isInviteLink: true,
      });
    }

    // Prevent sending challenges to yourself
    if (creatorId === recipientId) {
      return res.status(400).json({ error: 'Cannot send challenge to yourself' });
    }

    // Check limit of 3 pending challenges per user
    try {
      const sentResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/private-challenge/sent?userId=${creatorId}`
      );

      if (sentResponse.ok) {
        const sentData = await sentResponse.json();
        const pendingChallenges =
          sentData.challenges?.filter((challenge: any) => challenge.status === 'pending') || [];

        if (pendingChallenges.length >= 3) {
          return res.status(400).json({
            error:
              'You can only have 3 pending challenges at a time. Wait for existing challenges to be resolved.',
          });
        }
      }
    } catch (error) {
      console.error('Error checking pending challenges:', error);
      // Continue with creation if limit check fails
    }

    // Get owner wallet addresses from Lens accounts (skip for invite links)
    const [creatorData, recipientData] = await Promise.all([
      lensApolloClient.query<AccountQuery, AccountQueryVariables>({
        query: AccountDocument,
        variables: { request: { address: creatorId } },
      }),
      recipientId !== 'invite-link'
        ? lensApolloClient.query<AccountQuery, AccountQueryVariables>({
            query: AccountDocument,
            variables: { request: { address: recipientId } },
          })
        : Promise.resolve({ data: { account: { owner: 'invite-link' } } }),
    ]);

    const creatorOwnerAddress = creatorData.data?.account?.owner;
    const recipientOwnerAddress = recipientData.data?.account?.owner;

    if (!creatorOwnerAddress || (!recipientOwnerAddress && recipientId !== 'invite-link')) {
      return res.status(400).json({ error: 'Could not find wallet addresses for users' });
    }

    // Create challenge using Lens account IDs but store owner wallet addresses
    const challengeId = await createPrivateChallenge(
      creatorId, // Lens account address for identification
      recipientId, // Lens account address for identification
      name,
      description,
      rewardAmount,
      1 // 1 day expiration
    );

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
