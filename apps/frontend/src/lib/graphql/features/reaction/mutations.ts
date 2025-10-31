import { gql } from '@apollo/client';
export const CREATE_REACTION = gql`
  mutation CreateReaction(
    $id: String!
    $userLensAccountId: String!
    $completionId: String!
    $reactionType: String!
    $selfieCID: String!
    $createdAt: DateTime!
  ) {
    addReaction(
      input: [
        {
          id: $id
          userLensAccountId: $userLensAccountId
          completion: { id: $completionId }
          reactionType: $reactionType
          selfieCID: $selfieCID
          createdAt: $createdAt
        }
      ]
    ) {
      reaction {
        id
        reactionType
        selfieCID
        userLensAccountId
      }
    }
  }
`;
