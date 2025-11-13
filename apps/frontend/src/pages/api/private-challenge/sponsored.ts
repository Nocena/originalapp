/**
 * Sponsored Challenges API
 *
 * Fetches all sponsored challenges (private challenges with targetUserId = 'sponsored')
 * that the current user hasn't completed yet
 */

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId parameter is required' });
  }

  try {
    // First, get all active sponsored challenges
    const challengesQuery = `
      query GetSponsoredChallenges {
        queryPrivateChallenge(filter: { 
          and: [
            { targetLensAccountId: { eq: "sponsored" } },
            { isActive: true }
          ]
        }) {
          id
          title
          description
          reward
          createdAt
          expiresAt
          creatorLensAccountId
        }
      }
    `;

    // Then, get all challenge completions by this user for private challenges
    const completionsQuery = `
      query GetUserPrivateChallengeCompletions($userId: String!) {
        queryChallengeCompletion(
          filter: {
            and: [
              { userLensAccountId: { eq: $userId } }
              { privateChallengeId: { has: privateChallengeId } }
            ]
          }
        ) {
          privateChallengeId
        }
      }
    `;

    const [challengesResponse, completionsResponse] = await Promise.all([
      axios.post(
        DGRAPH_ENDPOINT,
        { query: challengesQuery },
        { headers: { 'Content-Type': 'application/json' } }
      ),
      axios.post(
        DGRAPH_ENDPOINT,
        {
          query: completionsQuery,
          variables: { userId: userId as string },
        },
        { headers: { 'Content-Type': 'application/json' } }
      ),
    ]);

    if (challengesResponse.data.errors) {
      console.error('Dgraph challenges query error:', challengesResponse.data.errors);
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (completionsResponse.data.errors) {
      console.error('Dgraph completions query error:', completionsResponse.data.errors);
      // Don't fail if completions query fails, just show all challenges
    }

    const allChallenges = challengesResponse.data.data?.queryPrivateChallenge || [];
    const completedChallengeIds = new Set(
      (completionsResponse.data.data?.queryChallengeCompletion || [])
        .map((c: any) => c.privateChallengeId)
        .filter(Boolean)
    );

    // Filter out expired challenges and challenges the user has completed
    const now = new Date();
    const availableChallenges = allChallenges.filter((challenge: any) => {
      const isNotExpired = new Date(challenge.expiresAt) > now;
      const isNotCompleted = !completedChallengeIds.has(challenge.id);
      return isNotExpired && isNotCompleted;
    });

    // Transform to match expected sponsored challenge format
    const sponsoredChallenges = availableChallenges.map((challenge: any) => {
      // Extract sponsor name from title (format: "SponsorName: Challenge Title")
      const titleParts = challenge.title.split(': ');
      const sponsorName = titleParts.length > 1 ? titleParts[0] : 'Unknown Sponsor';
      const challengeTitle =
        titleParts.length > 1 ? titleParts.slice(1).join(': ') : challenge.title;

      return {
        id: challenge.id,
        companyName: sponsorName,
        challengeTitle: challengeTitle,
        challengeDescription: challenge.description,
        reward: `${challenge.reward} FLOW tokens`,
        createdAt: challenge.createdAt,
        expiresAt: challenge.expiresAt,
        creatorLensAccountId: challenge.creatorLensAccountId,
      };
    });

    return res.status(200).json({
      success: true,
      challenges: sponsoredChallenges,
    });
  } catch (error) {
    console.error('Error fetching sponsored challenges:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
