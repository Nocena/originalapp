import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { challengeId } = req.query;

  if (!challengeId || typeof challengeId !== 'string') {
    return res.status(400).json({ error: 'Challenge ID is required' });
  }

  try {
    const query = `
      query GetPrivateChallenge($challengeId: String!) {
        getPrivateChallenge(id: $challengeId) {
          id
          title
          description
          reward
          createdAt
          expiresAt
          isActive
          isCompleted
          creatorLensAccountId
          targetLensAccountId
        }
      }
    `;

    const response = await axios.post(DGRAPH_ENDPOINT, {
      query,
      variables: { challengeId },
    });

    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      return res.status(500).json({ error: 'Database query failed' });
    }

    const challenge = response.data.data?.getPrivateChallenge;

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if challenge is expired
    const now = new Date();
    const expiresAt = new Date(challenge.expiresAt);

    if (now > expiresAt || !challenge.isActive) {
      return res.status(410).json({ error: 'Challenge has expired or is no longer active' });
    }

    res.status(200).json({
      success: true,
      challenge,
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
