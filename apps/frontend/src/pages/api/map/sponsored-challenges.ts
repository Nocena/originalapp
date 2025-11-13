import type { NextApiRequest, NextApiResponse } from 'next';
import graphqlClient from '../../../lib/graphql/client';
import { gql } from '@apollo/client';

const GET_SPONSORED_CHALLENGES = gql`
  query GetSponsoredChallenges {
    queryPublicChallenge(filter: { isActive: true }) {
      id
      title
      description
      reward
      location {
        latitude
        longitude
      }
      createdAt
      creatorLensAccountId
      maxParticipants
      participantCount
    }
  }
`;

const GET_USER_COMPLETIONS = gql`
  query GetUserCompletions($userAddress: String!) {
    queryChallengeCompletion(
      filter: { userLensAccountId: { eq: $userAddress }, challengeType: { eq: "public" } }
    ) {
      publicChallengeId
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress } = req.query;

    if (!userAddress || typeof userAddress !== 'string') {
      return res.status(400).json({ error: 'Missing userAddress' });
    }

    // Query sponsored challenges and user completions in parallel
    const [challengesResult, completionsResult] = await Promise.all([
      graphqlClient.query({
        query: GET_SPONSORED_CHALLENGES,
        fetchPolicy: 'network-only',
      }),
      graphqlClient.query({
        query: GET_USER_COMPLETIONS,
        variables: { userAddress },
        fetchPolicy: 'network-only',
      }),
    ]);

    const allChallenges = challengesResult.data?.queryPublicChallenge || [];
    const completions = completionsResult.data?.queryChallengeCompletion || [];

    // Filter for sponsored challenges (those with colon in title)
    const sponsoredChallenges = allChallenges.filter((c: any) => c.title.includes(':'));

    // Get completed challenge IDs
    const completedChallengeIds = new Set(
      completions.map((c: any) => c.publicChallengeId).filter(Boolean)
    );

    // Filter out completed challenges
    const availableChallenges = sponsoredChallenges.filter(
      (c: any) => !completedChallengeIds.has(c.id)
    );

    return res.status(200).json({
      challenges: availableChallenges.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        reward: c.reward,
        position: [c.location.longitude, c.location.latitude],
        color: '#FFD700', // Gold color for sponsored challenges
        creatorLensAccountId: c.creatorLensAccountId,
        completionCount: 0,
        participantCount: c.participantCount || 0,
        maxParticipants: c.maxParticipants || 50,
        recentCompletions: [],
        isSponsored: true,
      })),
    });
  } catch (error) {
    console.error('Error loading sponsored challenges:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
