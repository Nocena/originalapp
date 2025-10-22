import { gql } from '@apollo/client';

export const FETCH_FOLLOWER_COMPLETIONS = gql`
    query FetchFollowerCompletions($userId: String!, $startDate: DateTime!, $endDate: DateTime!) {
        getUser(id: $userId) {
            following {
                id
                username
                profilePicture
                completedChallenges(
                    filter: {
                        and: [
                            { completionDate: { between: { min: $startDate, max: $endDate } } },
                            { has: aiChallenge },
                            { challengeType: { eq: "ai" } }
                        ]
                    }
                    order: { desc: completionDate }
                    first: 1
                ) {
                    id
                    media
                    completionDate
                    status
                    challengeType
                    aiChallenge {
                        id
                        title
                        frequency
                        reward
                    }
                }
            }
        }
    }
`;