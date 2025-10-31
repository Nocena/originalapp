'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GET_ACTIVE_PUBLIC_CHALLENGES = void 0;
const client_1 = require('@apollo/client');
exports.GET_ACTIVE_PUBLIC_CHALLENGES = (0, client_1.gql)`
  query GetActivePublicChallenges {
    queryPublicChallenge(filter: { isActive: true }) {
      id
      title
      description
      reward
      creatorLensAccountId
      location {
        latitude
        longitude
      }
      participantCount
      maxParticipants
      createdAt
      completions {
        id
        userLensAccountId
        completionDate
      }
    }
  }
`;
