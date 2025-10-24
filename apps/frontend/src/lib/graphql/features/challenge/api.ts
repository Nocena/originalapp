import graphqlClient from '../../client';
import { GET_ACTIVE_PUBLIC_CHALLENGES } from './queries';
import { filterNearbyChallenges, transformChallengeData } from './utils';
import { ChallengeData } from './types';

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