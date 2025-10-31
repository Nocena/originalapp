import { gql } from '@apollo/client';

export const ADD_AI_CHALLENGE = gql`
  mutation AddDailyChallenge($challenge: AddAIChallengeInput!) {
    addAIChallenge(input: [$challenge]) {
      aIChallenge {
        id
        title
      }
    }
  }
`;
