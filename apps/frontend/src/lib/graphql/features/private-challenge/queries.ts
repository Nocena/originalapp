import { gql } from '@apollo/client';
import { PRIVATE_CHALLENGE_FIELDS } from '../../fragments';

export const GET_CHALLENGES_BY_RECIPIENT = gql`
  query GetChallengesByRecipient($recipientId: ID!) {
    queryPrivateChallenge(filter: { targetUser: { id: { eq: $recipientId } } }) {
      ...PrivateChallengeFields
    }
  }
  ${PRIVATE_CHALLENGE_FIELDS}
`;

export const GET_CHALLENGES_BY_CREATOR = gql`
  query GetChallengesByCreator($creatorId: ID!) {
    queryPrivateChallenge(filter: { creator: { id: { eq: $creatorId } } }) {
      ...PrivateChallengeFields
    }
  }
  ${PRIVATE_CHALLENGE_FIELDS}
`;

export const GET_CHALLENGE_BY_ID = gql`
  query GetChallengeById($id: ID!) {
    getPrivateChallenge(id: $id) {
      ...PrivateChallengeFields
    }
  }
  ${PRIVATE_CHALLENGE_FIELDS}
`;
