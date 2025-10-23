import { gql } from '@apollo/client';

// ============================================================================
// USER FRAGMENTS
// ============================================================================

export const USER_BASIC_FIELDS = gql`
  fragment UserBasicFields on User {
    id
    username
    bio
    wallet
    profilePicture
    coverPhoto
    trailerVideo
    earnedTokens
    earnedTokensToday
    earnedTokensThisWeek
    earnedTokensThisMonth
    personalField1Type
    personalField1Value
    personalField1Metadata
    personalField2Type
    personalField2Value
    personalField2Metadata
    personalField3Type
    personalField3Value
    personalField3Metadata
    lensHandle
    lensAccountId
    lensTransactionHash
    lensMetadataUri
    pushSubscription
    dailyChallenge
    weeklyChallenge
    monthlyChallenge
    currentAvatar
    baseAvatar
  }
`;

export const USER_WITH_RELATIONS = gql`
  fragment UserWithRelations on User {
    ...UserBasicFields
    followers {
      id
    }
    following {
      id
    }
  }
  ${USER_BASIC_FIELDS}
`;

export const USER_WITH_EQUIPMENT = gql`
  fragment UserWithEquipment on User {
    ...UserBasicFields
    equippedCap {
      ...NFTItemFields
    }
    equippedHoodie {
      ...NFTItemFields
    }
    equippedPants {
      ...NFTItemFields
    }
    equippedShoes {
      ...NFTItemFields
    }
    avatarHistory {
      ...AvatarFields
    }
  }
  ${USER_BASIC_FIELDS}
`;

// ============================================================================
// NFT FRAGMENTS
// ============================================================================

export const NFT_ITEM_FIELDS = gql`
  fragment NFTItemFields on NFTItem {
    id
    name
    description
    itemType
    rarity
    tokenBonus
    imageUrl
    imageCID
    generatedAt
    generationPrompt
    isEquipped
    tokenId
    mintTransactionHash
  }
`;

export const AVATAR_FIELDS = gql`
  fragment AvatarFields on Avatar {
    id
    baseImageUrl
    generatedImageUrl
    baseImageCID
    generatedImageCID
    generationPrompt
    generatedAt
    isActive
    equippedCap {
      ...NFTItemFields
    }
    equippedHoodie {
      ...NFTItemFields
    }
    equippedPants {
      ...NFTItemFields
    }
    equippedShoes {
      ...NFTItemFields
    }
  }
  ${NFT_ITEM_FIELDS}
`;

// ============================================================================
// CHALLENGE FRAGMENTS
// ============================================================================

export const PRIVATE_CHALLENGE_FIELDS = gql`
  fragment PrivateChallengeFields on PrivateChallenge {
    id
    title
    description
    reward
    createdAt
    expiresAt
    isActive
    isCompleted
  }
`;

export const PUBLIC_CHALLENGE_FIELDS = gql`
  fragment PublicChallengeFields on PublicChallenge {
    id
    title
    description
    reward
    createdAt
    isActive
    location {
      latitude
      longitude
    }
    maxParticipants
    participantCount
    creator {
      id
      username
      profilePicture
    }
  }
`;

export const AI_CHALLENGE_FIELDS = gql`
  fragment AIChallengeFields on AIChallenge {
    id
    title
    description
    reward
    createdAt
    isActive
    frequency
    day
    week
    month
    year
  }
`;

export const CHALLENGE_COMPLETION_FIELDS = gql`
  fragment ChallengeCompletionFields on ChallengeCompletion {
    id
    completionDate
    completionDay
    completionWeek
    completionMonth
    completionYear
    media
    challengeType
    status
    likesCount
    user {
      id
      username
      profilePicture
    }
  }
`;

export const CHALLENGE_COMPLETION_WITH_CHALLENGE = gql`
  fragment ChallengeCompletionWithChallenge on ChallengeCompletion {
    ...ChallengeCompletionFields
    privateChallenge {
      id
      title
    }
    publicChallenge {
      id
      title
    }
    aiChallenge {
      id
      title
      frequency
    }
  }
  ${CHALLENGE_COMPLETION_FIELDS}
`;

// ============================================================================
// NOTIFICATION FRAGMENTS
// ============================================================================

export const NOTIFICATION_FIELDS = gql`
  fragment NotificationFields on Notification {
    id
    userId
    triggeredById
    content
    notificationType
    isRead
    createdAt
    triggeredBy {
      id
      username
      profilePicture
    }
    privateChallenge {
      id
      title
    }
    publicChallenge {
      id
      title
    }
    aiChallenge {
      id
      title
    }
  }
`;
