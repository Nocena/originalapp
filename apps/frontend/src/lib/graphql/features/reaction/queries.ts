import { gql } from '@apollo/client';

export const GET_COMPLETION_OWNER = gql`
  query GetCompletionOwner($completionId: String!) {
    getChallengeCompletion(id: $completionId) {
      id
      userLensAccountId
    }
  }
`;
