import { gql } from '@apollo/client';
import {
  USER_BASIC_FIELDS,
  USER_WITH_RELATIONS,
  CHALLENGE_COMPLETION_WITH_CHALLENGE,
} from '../../fragments';

export const GET_USER_BY_WALLET = gql`
  query GetUserByWallet($walletAddress: String!, $normalizedWallet: String!) {
    queryUser(
      filter: { or: [{ wallet: { eq: $walletAddress } }, { wallet: { eq: $normalizedWallet } }] }
    ) {
      ...UserWithRelations
      completedChallenges {
        ...ChallengeCompletionWithChallenge
      }
    }
  }
  ${USER_WITH_RELATIONS}
  ${CHALLENGE_COMPLETION_WITH_CHALLENGE}
`;

export const GET_USER_BY_LENS_ACCOUNT_ID = gql`
  query GetUserByWallet($lensAccountId: String!) {
    queryUser(
      filter: { lensAccountId: { eq: $lensAccountId} }
    ) {
      ...UserWithRelations
      completedChallenges {
        ...ChallengeCompletionWithChallenge
      }
    }
  }
  ${USER_WITH_RELATIONS}
  ${CHALLENGE_COMPLETION_WITH_CHALLENGE}
`;

export const GET_USERS_BY_WALLET_AND_LENS_ACCOUNTS = gql`
  query GetUsersByWalletAndLens(
    $walletAddress: String!
    $normalizedWallet: String!
    $lensIds: [String!]
  ) {
    queryUser(
      filter: {
        and: [
          { or: [{ wallet: { eq: $walletAddress } }, { wallet: { eq: $normalizedWallet } }] }
          { lensAccountId: { in: $lensIds } }
        ]
      }
    ) {
      ...UserWithRelations
      completedChallenges {
        ...ChallengeCompletionWithChallenge
      }
    }
  }
  ${USER_WITH_RELATIONS}
  ${CHALLENGE_COMPLETION_WITH_CHALLENGE}
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($userId: String!) {
    queryUser(filter: { id: { eq: $userId } }) {
      ...UserWithRelations
      completedChallenges {
        ...ChallengeCompletionWithChallenge
      }
    }
  }
  ${USER_WITH_RELATIONS}
  ${CHALLENGE_COMPLETION_WITH_CHALLENGE}
`;

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    queryUser {
      ...UserBasicFields
      followers {
        id
      }
      following {
        id
      }
    }
  }
  ${USER_BASIC_FIELDS}
`;

export const SEARCH_USERS = gql`
  query SearchUsers($searchQuery: String!) {
    queryUser(filter: { or: [{ username: { regexp: $searchQuery } }] }) {
      id
      username
      bio
      profilePicture
      wallet
      lensHandle
    }
  }
`;

export const GET_USER_FOLLOWERS = gql`
  query GetUserFollowers($userId: String!) {
    queryUser(filter: { id: { eq: $userId } }) {
      followers {
        id
      }
    }
  }
`;

export const CHECK_WALLET_EXISTS = gql`
  query CheckWalletExists($walletAddress: String!, $normalizedWallet: String!) {
    queryUser(
      filter: { or: [{ wallet: { eq: $walletAddress } }, { wallet: { eq: $normalizedWallet } }] }
    ) {
      id
      wallet
    }
  }
`;

export const CHECK_USERNAME_EXISTS = gql`
  query CheckUsernameExists($username: String!) {
    queryUser(filter: { username: { eq: $username } }) {
      id
      username
    }
  }
`;

export const GET_LEADERBOARD = gql`
  query GetLeaderboard($first: Int, $offset: Int) {
    queryUser(order: { desc: earnedTokens }, first: $first, offset: $offset) {
      id
      username
      profilePicture
      earnedTokens
      earnedTokensToday
      earnedTokensThisWeek
      earnedTokensThisMonth
    }
  }
`;

export const GET_ALL_PUSH_SUBSCRIPTIONS = gql`
  query GetAllPushSubscriptions {
    queryUser(filter: { pushSubscription: { ne: "" } }) {
      pushSubscription
    }
  }
`;
