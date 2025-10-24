import { gql } from '@apollo/client';

export const GET_ACTIVE_PUBLIC_CHALLENGES = gql`
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