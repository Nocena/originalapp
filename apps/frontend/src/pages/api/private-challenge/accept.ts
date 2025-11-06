import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { challengeId, recipientId } = req.body;

  if (!challengeId || !recipientId) {
    return res.status(400).json({ error: 'Challenge ID and recipient ID are required' });
  }

  try {
    // First, get the challenge to verify it exists and is valid
    const getQuery = `
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

    const getResponse = await axios.post(DGRAPH_ENDPOINT, {
      query: getQuery,
      variables: { challengeId },
    });

    if (getResponse.data.errors) {
      console.error('GraphQL errors:', getResponse.data.errors);
      return res.status(500).json({ error: 'Database query failed' });
    }

    const challenge = getResponse.data.data?.getPrivateChallenge;

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if challenge is expired or inactive
    const now = new Date();
    const expiresAt = new Date(challenge.expiresAt);

    if (now > expiresAt || !challenge.isActive || challenge.isCompleted) {
      return res.status(410).json({ error: 'Challenge has expired or is no longer available' });
    }

    // Check if this is an invite link challenge (targetLensAccountId is 'invite-link')
    if (challenge.targetLensAccountId !== 'invite-link') {
      return res.status(400).json({ error: 'This challenge is not an invite link' });
    }

    // Update the challenge to assign it to the accepting user
    const updateMutation = `
      mutation AcceptInviteChallenge($challengeId: String!, $recipientId: String!) {
        updatePrivateChallenge(input: {
          filter: { id: { eq: $challengeId } },
          set: { 
            targetLensAccountId: $recipientId
          }
        }) {
          privateChallenge {
            id
            title
            targetLensAccountId
          }
        }
      }
    `;

    const updateResponse = await axios.post(DGRAPH_ENDPOINT, {
      query: updateMutation,
      variables: { challengeId, recipientId },
    });

    if (updateResponse.data.errors) {
      console.error('Update errors:', updateResponse.data.errors);
      return res.status(500).json({ error: 'Failed to accept challenge' });
    }

    res.status(200).json({
      success: true,
      message: 'Challenge accepted successfully',
      challengeId,
    });
  } catch (error) {
    console.error('Error accepting challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
