import { gql } from '@apollo/client';

export const FETCH_USER_COMPLETIONS_BY_FILTERS = gql`
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

export const USER_CHALLENGE_COMPLETIONS = gql`
    query GetUserChallengeCompletions($userLensAccountId: String!, $limit: Int, $offset: Int) {
        queryChallengeCompletion(
            filter: { userLensAccountId: { eq: $userLensAccountId } }
            order: { desc: completionDate }
            first: $limit
            offset: $offset
        ) {
            id
            userLensAccountId
            completionDate
            likedByLensAccountIds
            likesCount
            challengeType
            status
            media

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


export const FETCH_COMPLETIONS_OF_USERS = gql`
    query FetchUserCompletions(
        $userLensAccountIds: [String!]!
        $startDate: DateTime!
        $endDate: DateTime!
        $challengeType: String
    ) {
        queryChallengeCompletion(
            filter: {
                userLensAccountId: { in: $userLensAccountIds }
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

export const FETCH_ALL_COMPLETIONS = gql`
    query GetAllChallengeCompletions {
        queryChallengeCompletion(order: { desc: completionDate }) {
            id
            userLensAccountId
            completionDate
            media
            challengeType
            likesCount
            likedByLensAccountIds
            reactions {
                id
                reactionType
                selfieCID
                createdAt
                userLensAccountId
            }
            publicChallenge {
                id
                title
                description
                reward
            }
            aiChallenge {
                id
                title
                description
                reward
                frequency
            }
            privateChallenge {
                id
                title
                description
                reward
            }
        }
    }
`;

export const FETCH_COMPLETIONS_BY_CHALLENGE = gql`
    query GetChallengeCompletionsByChallenge($challengeId: String!) {
        queryChallengeCompletion(
            filter: {
                or: [
                    { and: [{ has: publicChallenge }, { publicChallenge: { id: { eq: $challengeId } } }] },
                    { and: [{ has: privateChallenge }, { privateChallenge: { id: { eq: $challengeId } } }] },
                    { and: [{ has: aiChallenge }, { aiChallenge: { id: { eq: $challengeId } } }] }
                ]
            }
            order: { desc: completionDate }
        ) {
            id
            userLensAccountId
            completionDate
            media
            challengeType
            likesCount
            likedByLensAccountIds
            reactions {
                id
                reactionType
                selfieCID
                createdAt
                userLensAccountId
            }
            publicChallenge {
                id
                title
                description
                reward
            }
            aiChallenge {
                id
                title
                description
                reward
                frequency
            }
            privateChallenge {
                id
                title
                description
                reward
            }
        }
    }
`;

export const GET_COMPLETION_FOR_LIKES = gql`
    query GetCompletion($completionId: String!) {
        getChallengeCompletion(id: $completionId) {
            id
            likedByLensAccountIds
            likesCount
        }
    }
`;

/**
 * Check if completion is already liked by this user
 */
export const CHECK_LIKE_STATUS = gql`
    query CheckLikeStatus($completionId: String!, $userId: String!) {
        getChallengeCompletion(id: $completionId) {
            id
            likesCount
            likes(filter: { id: { eq: $userId } }) {
                id
            }
            user {
                id
                username
            }
        }
    }
`;
