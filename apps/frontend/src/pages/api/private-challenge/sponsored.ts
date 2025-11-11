/**
 * Sponsored Challenges API
 * 
 * Fetches all sponsored challenges (private challenges with targetUserId = 'sponsored')
 */

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const query = `
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

    const response = await axios.post(
      DGRAPH_ENDPOINT,
      { query },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      return res.status(500).json({ error: 'Database query failed' });
    }

    const privateChallenges = response.data.data?.queryPrivateChallenge || [];
    
    // Filter out expired challenges
    const now = new Date();
    const activeChallenges = privateChallenges.filter((challenge: any) => {
      return new Date(challenge.expiresAt) > now;
    });
    
    // Transform to match expected sponsored challenge format
    const sponsoredChallenges = activeChallenges.map((challenge: any) => {
      // Extract sponsor name from title (format: "SponsorName: Challenge Title")
      const titleParts = challenge.title.split(': ');
      const sponsorName = titleParts.length > 1 ? titleParts[0] : 'Unknown Sponsor';
      const challengeTitle = titleParts.length > 1 ? titleParts.slice(1).join(': ') : challenge.title;
      
      return {
        id: challenge.id,
        companyName: sponsorName,
        challengeTitle: challengeTitle,
        challengeDescription: challenge.description,
        reward: `${challenge.reward} FLOW tokens`,
        createdAt: challenge.createdAt,
        expiresAt: challenge.expiresAt,
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
