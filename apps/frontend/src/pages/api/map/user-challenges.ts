import type { NextApiRequest, NextApiResponse } from 'next';
import graphqlClient from '../../../lib/graphql/client';
import { gql } from '@apollo/client';

const GET_USER_WEEKLY_CHALLENGES = gql`
  query GetUserWeeklyChallenges($creatorId: String!) {
    queryPublicChallenge(filter: { creatorLensAccountId: { eq: $creatorId }, isActive: true }) {
      id
      title
      description
      reward
      location {
        latitude
        longitude
      }
      createdAt
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

    // Get current week ID
    const now = new Date();
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
    monday.setUTCHours(0, 0, 0, 0);
    const weekId = monday.toISOString().split('T')[0];

    // Query user's challenges and completions in parallel
    const [challengesResult, completionsResult] = await Promise.all([
      graphqlClient.query({
        query: GET_USER_WEEKLY_CHALLENGES,
        variables: { creatorId: userAddress },
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

    // Get completed challenge IDs
    const completedChallengeIds = new Set(
      completions.map((c: any) => c.publicChallengeId).filter(Boolean)
    );

    // Filter challenges by current week and exclude completed ones
    const weekChallenges = allChallenges.filter(
      (c: any) =>
        c.description &&
        c.description.includes(`|week:${weekId}`) &&
        !completedChallengeIds.has(c.id)
    );

    return res.status(200).json({
      challenges: weekChallenges.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description.split('|week:')[0], // Remove week metadata
        reward: c.reward,
        position: [c.location.longitude, c.location.latitude],
        color: '#10CAFF',
        creatorLensAccountId: userAddress,
        completionCount: 0,
        participantCount: 0,
        maxParticipants: 1,
        recentCompletions: [],
      })),
      hasGenerated: allChallenges.some(
        (c: any) => c.description && c.description.includes(`|week:${weekId}`)
      ),
    });
  } catch (error) {
    console.error('Error loading user challenges:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
