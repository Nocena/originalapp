'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.createAIChallenge = createAIChallenge;
exports.fetchNearbyChallenge = fetchNearbyChallenge;
const client_1 = __importDefault(require('../../client'));
const queries_1 = require('./queries');
const mutations_1 = require('./mutations');
const utils_1 = require('./utils');
async function createAIChallenge(challengeData) {
  try {
    await client_1.default.mutate({
      mutation: mutations_1.ADD_AI_CHALLENGE,
      variables: { challenge: challengeData },
    });
    return true;
  } catch (error) {
    console.error('❌ Error creating AI challenge:', error);
    return false;
  }
}
async function fetchNearbyChallenge(userLocation) {
  try {
    const { data } = await client_1.default.query({
      query: queries_1.GET_ACTIVE_PUBLIC_CHALLENGES,
    });
    const allChallenges = data?.queryPublicChallenge || [];
    const nearby = (0, utils_1.filterNearbyChallenges)(
      allChallenges,
      userLocation.latitude,
      userLocation.longitude
    );
    return (0, utils_1.transformChallengeData)(nearby);
  } catch (error) {
    console.error('❌ Error fetching nearby challenges:', error);
    return [];
  }
}
