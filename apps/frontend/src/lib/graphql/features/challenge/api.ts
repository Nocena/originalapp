import graphqlClient from '../../client';
import { GET_ACTIVE_PUBLIC_CHALLENGES } from './queries';
import { ADD_AI_CHALLENGE } from './mutations';
import { filterNearbyChallenges, transformChallengeData } from './utils';
import { ChallengeData } from './types';

interface LocationData {
  latitude: number;
  longitude: number;
}

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

export async function createAIChallenge(challengeData: AIChallengeInput): Promise<boolean> {
  try {
    await graphqlClient.mutate({
      mutation: ADD_AI_CHALLENGE,
      variables: { challenge: challengeData },
    });
    return true;
  } catch (error) {
    console.error('❌ Error creating AI challenge:', error);
    return false;
  }
}

interface LocationData {
  latitude: number;
  longitude: number;
}

export async function fetchNearbyChallenge(userLocation: LocationData): Promise<ChallengeData[]> {
  try {
    const { data } = await graphqlClient.query({
      query: GET_ACTIVE_PUBLIC_CHALLENGES,
    });

    const allChallenges = data?.queryPublicChallenge || [];

    const nearby = filterNearbyChallenges(
      allChallenges,
      userLocation.latitude,
      userLocation.longitude
    );

    return transformChallengeData(nearby);
  } catch (error) {
    console.error('❌ Error fetching nearby challenges:', error);
    return [];
  }
}
