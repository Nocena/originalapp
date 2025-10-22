import { gql } from '@apollo/client';

export const FETCH_USER_COMPLETIONS = gql`
    query FetchUserCompletions(
        $userLensAccountId: String!
        $startDate: DateTime!
        $endDate: DateTime!
        $challengeType: String
    ) {
        queryChallengeCompletion(
            filter: {
                userLensAccountId: { eq: $userLensAccountId }
                completionDate: { between: { min: $startDate, max: $endDate } }
                challengeType: { eq: $challengeType }
            }
            order: { desc: completionDate }
        ) {
            id
            media
            completionDate
            completionDay
            completionWeek
            completionMonth
            completionYear
            status
            challengeType
            likesCount
            aiChallenge {
                id
                title
                description
                frequency
                reward
            }
            privateChallenge {
                id
                title
                description
                reward
            }
            publicChallenge {
                id
                title
                description
                reward
            }
        }
    }
`;

export const FETCH_LATEST_USER_COMPLETION = gql`
    query FetchLatestUserCompletion(
        $userLensAccountId: String!
        $challengeType: String
    ) {
        queryChallengeCompletion(
            filter: {
                userLensAccountId: { eq: $userLensAccountId }
                challengeType: { eq: $challengeType }
            }
            order: { desc: completionDate }
            first: 1
        ) {
            id
            media
            completionDate
            completionDay
            completionWeek
            completionMonth
            completionYear
            status
            challengeType
            likesCount
            userLensAccountId
            aiChallenge {
                id
                title
                description
                frequency
                reward
                day
                week
                month
                year
            }
            privateChallenge {
                id
                title
                description
                reward
            }
            publicChallenge {
                id
                title
                description
                reward
            }
        }
    }
`;