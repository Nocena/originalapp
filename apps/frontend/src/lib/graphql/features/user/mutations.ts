import { gql } from '@apollo/client';
import { USER_WITH_RELATIONS } from '../../fragments';

export const REGISTER_USER = gql`
  mutation RegisterUser($input: AddUserInput!) {
    addUser(input: [$input]) {
      user {
        ...UserWithRelations
      }
    }
  }
  ${USER_WITH_RELATIONS}
`;

export const UPDATE_USER_LENS_DATA = gql`
  mutation UpdateUserLensData(
    $userId: String!
    $lensHandle: String!
    $lensAccountId: String!
    $lensTransactionHash: String!
    $lensMetadataUri: String!
  ) {
    updateUser(
      filter: { id: { eq: $userId } }
      set: {
        lensHandle: $lensHandle
        lensAccountId: $lensAccountId
        lensTransactionHash: $lensTransactionHash
        lensMetadataUri: $lensMetadataUri
      }
    ) {
      user {
        id
        lensHandle
        lensAccountId
        lensTransactionHash
        lensMetadataUri
      }
    }
  }
`;

export const UPDATE_BIO = gql`
  mutation UpdateBio($userId: String!, $bio: String!) {
    updateUser(
      filter: { id: { eq: $userId } }
      set: { bio: $bio }
    ) {
      user {
        id
        bio
      }
    }
  }
`;

export const UPDATE_PROFILE_PICTURE = gql`
  mutation UpdateProfilePicture($userId: String!, $profilePicture: String!) {
    updateUser(
      filter: { id: { eq: $userId } }
      set: { profilePicture: $profilePicture }
    ) {
      user {
        id
        profilePicture
      }
    }
  }
`;

export const UPDATE_TRAILER_VIDEO = gql`
  mutation UpdateTrailerVideo($userId: String!, $trailerVideo: String!) {
    updateUser(
      filter: { id: { eq: $userId } }
      set: { trailerVideo: $trailerVideo }
    ) {
      user {
        id
        trailerVideo
      }
    }
  }
`;

export const UPDATE_COVER_PHOTO = gql`
  mutation UpdateCoverPhoto($userId: String!, $coverPhoto: String!) {
    updateUser(
      filter: { id: { eq: $userId } }
      set: { coverPhoto: $coverPhoto }
    ) {
      user {
        id
        coverPhoto
      }
    }
  }
`;

export const FOLLOW_USER = gql`
  mutation FollowUser($userId: String!, $targetUserId: String!) {
    updateUser(
      filter: { id: { eq: $userId } }
      set: { 
        following: [{ id: $targetUserId }] 
      }
    ) {
      user {
        id
        following {
          id
        }
      }
    }
  }
`;

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: String!, $targetUserId: String!) {
    updateUser(
      filter: { id: { eq: $userId } }
      remove: { 
        following: [{ id: $targetUserId }] 
      }
    ) {
      user {
        id
        following {
          id
        }
      }
    }
  }
`;

export const UPDATE_USER_TOKENS = gql`
  mutation UpdateUserTokens(
    $userId: String!
    $earnedTokens: Int!
    $earnedTokensToday: Int!
    $earnedTokensThisWeek: Int!
    $earnedTokensThisMonth: Int!
  ) {
    updateUser(
      filter: { id: { eq: $userId } }
      set: {
        earnedTokens: $earnedTokens
        earnedTokensToday: $earnedTokensToday
        earnedTokensThisWeek: $earnedTokensThisWeek
        earnedTokensThisMonth: $earnedTokensThisMonth
      }
    ) {
      user {
        id
        earnedTokens
        earnedTokensToday
        earnedTokensThisWeek
        earnedTokensThisMonth
      }
    }
  }
`;

export const UPDATE_USER_CHALLENGE_STRINGS = gql`
  mutation UpdateUserChallengeStrings(
    $userId: String!
    $dailyChallenge: String
    $weeklyChallenge: String
    $monthlyChallenge: String
  ) {
    updateUser(
      filter: { id: { eq: $userId } }
      set: {
        dailyChallenge: $dailyChallenge
        weeklyChallenge: $weeklyChallenge
        monthlyChallenge: $monthlyChallenge
      }
    ) {
      user {
        id
        dailyChallenge
        weeklyChallenge
        monthlyChallenge
      }
    }
  }
`;

export const RESET_DAILY_EARNINGS = gql`
  mutation ResetDailyEarnings {
    updateUser(
      filter: {}
      set: { earnedTokensToday: 0 }
    ) {
      numUids
    }
  }
`;

export const RESET_WEEKLY_EARNINGS = gql`
  mutation ResetWeeklyEarnings {
    updateUser(
      filter: {}
      set: { 
        earnedTokensThisWeek: 0
        earnedTokensToday: 0
      }
    ) {
      numUids
    }
  }
`;

export const RESET_MONTHLY_EARNINGS = gql`
  mutation ResetMonthlyEarnings {
    updateUser(
      filter: {}
      set: { 
        earnedTokensThisMonth: 0
        earnedTokensThisWeek: 0
        earnedTokensToday: 0
      }
    ) {
      numUids
    }
  }
`;

