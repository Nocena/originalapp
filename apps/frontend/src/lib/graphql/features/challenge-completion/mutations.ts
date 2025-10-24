import { gql } from '@apollo/client';

export const
  CREATE_CHALLENGE_COMPLETION = gql`
    mutation CreateChallengeCompletion(
        $id: String!
        $userLensAccountId: String!
        $media: String!
        $completionDate: DateTime!
        $completionDay: Int!
        $completionWeek: Int!
        $completionMonth: Int!
        $completionYear: Int!
        $challengeType: String!
        $privateChallenge: PrivateChallengeRef
        $publicChallenge: PublicChallengeRef
        $aiChallenge: AIChallengeRef
    ) {
        addChallengeCompletion(
            input: [{
                id: $id
                userLensAccountId: $userLensAccountId
                media: $media
                completionDate: $completionDate
                completionDay: $completionDay
                completionWeek: $completionWeek
                completionMonth: $completionMonth
                completionYear: $completionYear
                challengeType: $challengeType
                status: "verified"
                likesCount: 0
                privateChallenge: $privateChallenge
                publicChallenge: $publicChallenge
                aiChallenge: $aiChallenge
            }]
        ) {
            challengeCompletion {
                id
            }
        }
    }
`;