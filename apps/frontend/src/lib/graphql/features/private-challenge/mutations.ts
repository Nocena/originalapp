import { gql } from '@apollo/client';
import { PRIVATE_CHALLENGE_FIELDS } from '../../fragments';

export const CREATE_PRIVATE_CHALLENGE = gql`
  mutation CreatePrivateChallenge($input: AddPrivateChallengeInput!) {
    addPrivateChallenge(input: [$input]) {
      privateChallenge {
        ...PrivateChallengeFields
      }
    }
  }
  ${PRIVATE_CHALLENGE_FIELDS}
`;

export const UPDATE_CHALLENGE_STATUS = gql`
  mutation UpdateChallengeStatus($id: ID!, $isCompleted: Boolean!, $isActive: Boolean!) {
    updatePrivateChallenge(
      input: { filter: { id: [$id] }, set: { isCompleted: $isCompleted, isActive: $isActive } }
    ) {
      privateChallenge {
        ...PrivateChallengeFields
      }
    }
  }
  ${PRIVATE_CHALLENGE_FIELDS}
`;
