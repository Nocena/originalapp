'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.filterNearbyChallenges = filterNearbyChallenges;
exports.transformChallengeData = transformChallengeData;
const mapService_1 = require('../../../map/mapService');
function filterNearbyChallenges(allChallenges, userLat, userLng, radiusKm = 1000) {
  return allChallenges.filter((challenge) => {
    const distance = (0, mapService_1.calculateDistance)(
      userLat,
      userLng,
      challenge.location.latitude,
      challenge.location.longitude
    );
    return distance <= radiusKm;
  });
}
function transformChallengeData(challenges) {
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
          (a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
        )
        ?.slice(0, 5)
        ?.map((completion) => ({
          userLensAccountId: completion.userLensAccountId,
          completedAt: completion.completionDate,
        })) || [],
  }));
}
