'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ADD_AI_CHALLENGE = void 0;
const client_1 = require('@apollo/client');
exports.ADD_AI_CHALLENGE = (0, client_1.gql)`
  mutation AddDailyChallenge($challenge: AddAIChallengeInput!) {
    addAIChallenge(input: [$challenge]) {
      aIChallenge {
        id
        title
      }
    }
  }
`;
