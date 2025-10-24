import { calculateDistance } from '../../../map/mapService';
import { ChallengeData } from './types';

export function filterNearbyChallenges(allChallenges: any[], userLat: number, userLng: number, radiusKm: number = 1000) {
  return allChallenges.filter((challenge) => {
    const distance = calculateDistance(
      userLat,
      userLng,
      challenge.location.latitude,
      challenge.location.longitude
    );
    return distance <= radiusKm;
  });
}

export function transformChallengeData(challenges: any[]): ChallengeData[] {
  return challenges.map((challenge) => ({
    id: challenge.id,
    position: [challenge.location.longitude, challenge.location.latitude],
    title: challenge.title,
    description: challenge.description,
    reward: challenge.reward,
    color: '#2353FF',
    creatorLensAccountId: challenge.creatorLensAccountId,
    participantCount: challenge.participantCount,
    maxParticipants: challenge.maxParticipants,
    completionCount: challenge.completions?.length || 0,
    recentCompletions:
      challenge.completions
        ?.sort(
          (a: any, b: any) =>
            new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
        )
        ?.slice(0, 5)
        ?.map((completion: any) => ({
          userLensAccountId: completion.userLensAccountId,
          completedAt: completion.completionDate,
        })) || [],
  }));
}
