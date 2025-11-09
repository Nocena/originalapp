import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname, '../../../.env.local') });
import axios from 'axios';

interface AIChallengeInput {
  id: string;
  title: string;
  description: string;
  frequency: string;
  reward: number;
  createdAt: string;
  isActive: boolean;
  day?: number;
  month?: number;
  year?: number;
}

const DGRAPH_ENDPOINT = process.env.DGRAPH_ENDPOINT || process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT;

export async function createAIChallenge(challengeData: AIChallengeInput): Promise<boolean> {
  if (!DGRAPH_ENDPOINT) {
    console.error('DGRAPH_ENDPOINT is not configured');
    return false;
  }

  const mutation = `
    mutation AddAIChallenge($challenge: AddAIChallengeInput!) {
      addAIChallenge(input: [$challenge]) {
        aIChallenge {
          id
          title
        }
      }
    }
  `;

  try {
    await axios.post(DGRAPH_ENDPOINT, {
      query: mutation,
      variables: { challenge: challengeData }
    });
    return true;
  } catch (error) {
    console.error('❌ Error creating AI challenge:', error);
    return false;
  }
}
