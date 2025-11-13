import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  const cronSecret = req.headers.authorization?.replace('Bearer ', '');
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🧹 Starting challenge cleanup process...');

    // Calculate cutoff date (7 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffISO = cutoffDate.toISOString();

    // Query for old active challenges
    const query = `
      query GetOldChallenges($cutoffDate: DateTime!) {
        queryPublicChallenge(filter: { 
          and: [
            { isActive: true },
            { createdAt: { lt: $cutoffDate } }
          ]
        }) {
          id
          title
          createdAt
        }
      }
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.NEXT_PUBLIC_DGRAPH_API_KEY) {
      headers['X-Auth-Token'] = process.env.NEXT_PUBLIC_DGRAPH_API_KEY;
    }

    const queryResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query,
        variables: { cutoffDate: cutoffISO },
      },
      { headers }
    );

    const oldChallenges = queryResponse.data?.data?.queryPublicChallenge || [];
    console.log(`📊 Found ${oldChallenges.length} challenges older than 7 days`);

    if (oldChallenges.length === 0) {
      return res.status(200).json({
        message: 'No old challenges to cleanup',
        cleaned: 0,
      });
    }

    // Deactivate old challenges
    const mutation = `
      mutation DeactivateChallenges($ids: [ID!]!) {
        updatePublicChallenge(input: {
          filter: { id: $ids },
          set: { isActive: false }
        }) {
          publicChallenge {
            id
            title
            isActive
          }
        }
      }
    `;

    const challengeIds = oldChallenges.map((c: any) => c.id);

    const mutationResponse = await axios.post(
      DGRAPH_ENDPOINT,
      {
        query: mutation,
        variables: { ids: challengeIds },
      },
      { headers }
    );

    if (mutationResponse.data.errors) {
      console.error('❌ Mutation errors:', mutationResponse.data.errors);
      throw new Error('Failed to deactivate challenges');
    }

    const deactivated = mutationResponse.data?.data?.updatePublicChallenge?.publicChallenge || [];
    
    console.log(`✅ Successfully deactivated ${deactivated.length} old challenges`);

    return res.status(200).json({
      message: 'Challenge cleanup completed successfully',
      cleaned: deactivated.length,
      cutoffDate: cutoffISO,
    });

  } catch (error) {
    console.error('❌ Error in challenge cleanup:', error);
    return res.status(500).json({
      error: 'Challenge cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
