import { gql } from '@apollo/client';

export const CREATE_PUBLIC_CHALLENGE = gql`
  mutation CreatePublicChallenge($input: [AddPublicChallengeInput!]!) {
    addPublicChallenge(input: $input) {
      publicChallenge {
        id
        title
        description
        reward
        creatorLensAccountId
        createdAt
        isActive
        location {
          latitude
          longitude
        }
        maxParticipants
        participantCount
      }
    }
  }
`;
