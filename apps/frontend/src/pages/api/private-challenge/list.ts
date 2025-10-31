import { NextApiRequest, NextApiResponse } from 'next';
import { getPrivateChallengesByRecipient } from '../../../lib/api/dgraph';
import { AccountDocument, AccountQuery, AccountQueryVariables } from '@nocena/indexer';
import { lensApolloClient } from '../../_app';

async function getLensUsername(lensAccountId: string): Promise<string> {
  try {
    const { data } = await lensApolloClient.query<AccountQuery, AccountQueryVariables>({
      query: AccountDocument,
      variables: {
        request: { address: lensAccountId },
      },
    });

    return data?.account?.username?.localName || 'User';
  } catch (error) {
    console.error('Error fetching Lens username:', error);
    return 'User';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const challenges = await getPrivateChallengesByRecipient(userId);

    const formattedChallenges = await Promise.all(
      challenges.map(async (challenge) => {
        const creatorUsername = await getLensUsername(challenge.creatorLensAccountId);

        return {
          id: challenge.id,
          name: challenge.title,
          description: challenge.description,
          rewardAmount: challenge.reward,
          creatorId: challenge.creatorLensAccountId,
          creatorUsername,
          creatorProfilePicture: '/images/profile.png',
          creatorWalletAddress: challenge.creatorLensAccountId,
          recipientId: challenge.targetLensAccountId,
          recipientUsername: 'You',
          recipientWalletAddress: challenge.targetLensAccountId,
          status: challenge.isCompleted ? 'completed' : challenge.isActive ? 'pending' : 'expired',
          createdAt: challenge.createdAt,
          expiresAt: challenge.expiresAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      challenges: formattedChallenges,
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
