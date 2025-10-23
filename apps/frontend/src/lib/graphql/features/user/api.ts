import graphqlClient from '../../client';
import { generateId, normalizeWallet } from '../../utils';
import type { User } from '../../../../contexts/AuthContext';
import * as queries from './queries';
import * as mutations from './mutations';
import { createPublicClient, defineChain, http } from 'viem';
import { CONTRACTS, FLOW_TESTNET_CONFIG } from '../../../constants';
import noceniteTokenArtifact from '../../../../lib/contracts/nocenite.json';
// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  const normalizedWallet = normalizeWallet(walletAddress);

  try {
    const { data } = await graphqlClient.query({
      query: queries.GET_USER_BY_WALLET,
      variables: { walletAddress, normalizedWallet },
    });

    const userData = data.queryUser?.[0];
    if (!userData) return null;

    // Format the data to match User interface
    return formatUserData(userData);
  } catch (error) {
    console.error('Error getting user by wallet:', error);
    throw error;
  }
}

export async function getUserByLensAccountId(lensAccountAddress: string): Promise<User | null> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.GET_USER_BY_LENS_ACCOUNT_ID,
      variables: { lensAccountId: lensAccountAddress },
    });

    const userData = data.queryUser?.[0];
    if (!userData) return null;

    // Format the data to match User interface
    return formatUserData(userData);
  } catch (error) {
    console.error('Error getting user by wallet:', error);
    throw error;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.GET_USER_BY_ID,
      variables: { userId },
    });

    const userData = data.queryUser?.[0];
    if (!userData) return null;

    return formatUserData(userData);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

export async function fetchAllUsers(): Promise<User[]> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.GET_ALL_USERS,
    });

    return (data.queryUser || []).map(formatUserData);
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

export async function searchUsers(query: string): Promise<any[]> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.SEARCH_USERS,
      variables: { searchQuery: `/${query}/i` },
    });

    return data.queryUser || [];
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

export async function fetchUserFollowers(userId: string): Promise<string[]> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.GET_USER_FOLLOWERS,
      variables: { userId },
    });

    return data.queryUser?.[0]?.followers?.map((f: any) => f.id) || [];
  } catch (error) {
    console.error('Error fetching user followers:', error);
    throw error;
  }
}

export async function checkWalletExists(wallet: string): Promise<boolean> {
  try {
    const normalizedWallet = normalizeWallet(wallet);
    const { data } = await graphqlClient.query({
      query: queries.CHECK_WALLET_EXISTS,
      variables: { walletAddress: wallet, normalizedWallet },
    });

    return data.queryUser && data.queryUser.length > 0;
  } catch (error) {
    console.error('Error checking wallet exists:', error);
    throw error;
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.CHECK_USERNAME_EXISTS,
      variables: { username },
    });

    return data.queryUser && data.queryUser.length > 0;
  } catch (error) {
    console.error('Error checking username exists:', error);
    throw error;
  }
}

export async function getLeaderboard(
  timeFrame: 'today' | 'week' | 'month' | 'all-time',
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.GET_LEADERBOARD,
      variables: { first: limit, offset },
    });

    // Filter and sort on client side based on timeFrame
    let users = data.queryUser || [];

    if (timeFrame === 'today') {
      users.sort((a: any, b: any) => b.earnedTokensToday - a.earnedTokensToday);
    } else if (timeFrame === 'week') {
      users.sort((a: any, b: any) => b.earnedTokensThisWeek - a.earnedTokensThisWeek);
    } else if (timeFrame === 'month') {
      users.sort((a: any, b: any) => b.earnedTokensThisMonth - a.earnedTokensThisMonth);
    }

    return users;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

export async function getAllUserPushSubscriptions(): Promise<string[]> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.GET_ALL_PUSH_SUBSCRIPTIONS,
    });

    return (data.queryUser || [])
      .map((user: any) => user.pushSubscription)
      .filter((sub: string) => sub && sub.length > 0);
  } catch (error) {
    console.error('Error getting push subscriptions:', error);
    throw error;
  }
}

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

export async function registerUser(params: {
  username: string;
  bio: string;
  profilePicture: string;
  coverPhoto: string;
  trailerVideo: string;
  wallet: string;
  earnedTokens: number;
  earnedTokensToday: number;
  earnedTokensThisWeek: number;
  earnedTokensThisMonth: number;
  personalField1Type: string;
  personalField1Value: string;
  personalField1Metadata: string;
  personalField2Type: string;
  personalField2Value: string;
  personalField2Metadata: string;
  personalField3Type: string;
  personalField3Value: string;
  personalField3Metadata: string;
  dailyChallenge: string;
  weeklyChallenge: string;
  monthlyChallenge: string;
  inviteCode: string;
  lensHandle: string;
  lensAccountId: string;
  lensTransactionHash: string;
  lensMetadataUri: string;
  invitedById?: string;
  pushSubscription?: string | null;
}): Promise<any> {
  const normalizedWallet = normalizeWallet(params.wallet);
  const userId = generateId();
  const finalPushSubscription = params.pushSubscription || '';

  console.log('🔧 REGISTER: Starting user registration with:', {
    username: params.username,
    wallet: normalizedWallet,
    userId,
  });

  // Validate Lens data
  /*
  if (
    !params.lensHandle ||
    !params.lensAccountId ||
    !params.lensTransactionHash ||
    !params.lensMetadataUri
  ) {
    throw new Error('All Lens Protocol data is required for user registration');
  }
*/

  try {
    const input: any = {
      id: userId,
      username: params.username,
      bio: params.bio,
      wallet: normalizedWallet,
      profilePicture: params.profilePicture,
      coverPhoto: params.coverPhoto,
      trailerVideo: params.trailerVideo,
      earnedTokens: params.earnedTokens,
      earnedTokensToday: params.earnedTokensToday,
      earnedTokensThisWeek: params.earnedTokensThisWeek,
      earnedTokensThisMonth: params.earnedTokensThisMonth,
      personalField1Type: params.personalField1Type,
      personalField1Value: params.personalField1Value,
      personalField1Metadata: params.personalField1Metadata,
      personalField2Type: params.personalField2Type,
      personalField2Value: params.personalField2Value,
      personalField2Metadata: params.personalField2Metadata,
      personalField3Type: params.personalField3Type,
      personalField3Value: params.personalField3Value,
      personalField3Metadata: params.personalField3Metadata,
      dailyChallenge: params.dailyChallenge,
      weeklyChallenge: params.weeklyChallenge,
      monthlyChallenge: params.monthlyChallenge,
      inviteCode: params.inviteCode,
      invitedById: params.invitedById || null,
      pushSubscription: finalPushSubscription,
      lensHandle: params.lensHandle,
      lensAccountId: params.lensAccountId,
      lensTransactionHash: params.lensTransactionHash,
      lensMetadataUri: params.lensMetadataUri,
    };

    // Add invitedBy reference if exists
    if (params.invitedById && params.invitedById !== 'system') {
      input.invitedBy = { id: params.invitedById };
    }

    const { data } = await graphqlClient.mutate({
      mutation: mutations.REGISTER_USER,
      variables: { input },
    });

    const userData = data.addUser.user[0];

    if (userData) {
      return formatUserData(userData);
    }

    throw new Error('Failed to register user');
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

export async function updateBio(userId: string, newBio: string): Promise<void> {
  try {
    await graphqlClient.mutate({
      mutation: mutations.UPDATE_BIO,
      variables: { userId, bio: newBio },
    });
  } catch (error) {
    console.error('Error updating bio:', error);
    throw error;
  }
}

export async function updateProfilePicture(
  userId: string,
  profilePictureUrl: string
): Promise<void> {
  try {
    await graphqlClient.mutate({
      mutation: mutations.UPDATE_PROFILE_PICTURE,
      variables: { userId, profilePicture: profilePictureUrl },
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw error;
  }
}

export async function updateTrailerVideo(userId: string, trailerVideo: string): Promise<void> {
  try {
    await graphqlClient.mutate({
      mutation: mutations.UPDATE_TRAILER_VIDEO,
      variables: { userId, trailerVideo },
    });
  } catch (error) {
    console.error('Error updating trailer video:', error);
    throw error;
  }
}

export async function updateCoverPhoto(userId: string, coverPhoto: string): Promise<void> {
  try {
    await graphqlClient.mutate({
      mutation: mutations.UPDATE_COVER_PHOTO,
      variables: { userId, coverPhoto },
    });
  } catch (error) {
    console.error('Error updating cover photo:', error);
    throw error;
  }
}

export async function followUser(userId: string, targetUserId: string): Promise<void> {
  try {
    await graphqlClient.mutate({
      mutation: mutations.FOLLOW_USER,
      variables: { userId, targetUserId },
    });
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
}

export async function unfollowUser(userId: string, targetUserId: string): Promise<void> {
  try {
    await graphqlClient.mutate({
      mutation: mutations.UNFOLLOW_USER,
      variables: { userId, targetUserId },
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
}

export async function toggleFollowUser(
  userId: string,
  targetUserId: string,
  currentlyFollowing: boolean
): Promise<{ following: boolean; message: string }> {
  try {
    if (currentlyFollowing) {
      await unfollowUser(userId, targetUserId);
      return { following: false, message: 'Unfollowed successfully' };
    } else {
      await followUser(userId, targetUserId);
      return { following: true, message: 'Followed successfully' };
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    throw error;
  }
}

export async function updateUserTokens(userId: string, tokenAmount: number): Promise<void> {
  try {
    // Fetch current user data
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');

    const newTokens = user.earnedTokens + tokenAmount;
    const newTokensToday = user.earnedTokensDay + tokenAmount;
    const newTokensWeek = user.earnedTokensWeek + tokenAmount;
    const newTokensMonth = user.earnedTokensMonth + tokenAmount;

    await graphqlClient.mutate({
      mutation: mutations.UPDATE_USER_TOKENS,
      variables: {
        userId,
        earnedTokens: newTokens,
        earnedTokensToday: newTokensToday,
        earnedTokensThisWeek: newTokensWeek,
        earnedTokensThisMonth: newTokensMonth,
      },
    });
  } catch (error) {
    console.error('Error updating user tokens:', error);
    throw error;
  }
}

export async function updateUserChallengeStrings(
  userId: string,
  frequency: string | null
): Promise<void> {
  try {
    // Get current strings
    const user = await getUserById(userId);
    if (!user) throw new Error('User not found');

    const variables: any = { userId };

    if (frequency === 'daily' || !frequency) {
      variables.dailyChallenge = user.dailyChallenge;
    }
    if (frequency === 'weekly' || !frequency) {
      variables.weeklyChallenge = user.weeklyChallenge;
    }
    if (frequency === 'monthly' || !frequency) {
      variables.monthlyChallenge = user.monthlyChallenge;
    }

    await graphqlClient.mutate({
      mutation: mutations.UPDATE_USER_CHALLENGE_STRINGS,
      variables,
    });
  } catch (error) {
    console.error('Error updating challenge strings:', error);
    throw error;
  }
}

export async function resetTimeBasedEarnings(
  resetType: 'daily' | 'weekly' | 'monthly'
): Promise<void> {
  try {
    let mutation;

    switch (resetType) {
      case 'daily':
        mutation = mutations.RESET_DAILY_EARNINGS;
        break;
      case 'weekly':
        mutation = mutations.RESET_WEEKLY_EARNINGS;
        break;
      case 'monthly':
        mutation = mutations.RESET_MONTHLY_EARNINGS;
        break;
    }

    await graphqlClient.mutate({ mutation });
  } catch (error) {
    console.error('Error resetting earnings:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatUserData(userData: any): User {
  return {
    id: userData.id,
    username: userData.username,
    bio: userData.bio || '',
    wallet: userData.wallet,
    profilePicture: userData.profilePicture || '/images/profile.png',
    coverPhoto: userData.coverPhoto || '/images/cover.jpg',
    trailerVideo: userData.trailerVideo || '/trailer.mp4',
    earnedTokens: userData.earnedTokens || 0,
    earnedTokensDay: userData.earnedTokensToday || 0,
    earnedTokensWeek: userData.earnedTokensThisWeek || 0,
    earnedTokensMonth: userData.earnedTokensThisMonth || 0,
    personalField1Type: userData.personalField1Type || '',
    personalField1Value: userData.personalField1Value || '',
    personalField1Metadata: userData.personalField1Metadata || '',
    personalField2Type: userData.personalField2Type || '',
    personalField2Value: userData.personalField2Value || '',
    personalField2Metadata: userData.personalField2Metadata || '',
    personalField3Type: userData.personalField3Type || '',
    personalField3Value: userData.personalField3Value || '',
    personalField3Metadata: userData.personalField3Metadata || '',
    currentAvatar: userData.currentAvatar || null,
    baseAvatar: userData.baseAvatar || null,
    avatarHistory: userData.avatarHistory || [],
    equippedCap: userData.equippedCap || null,
    equippedHoodie: userData.equippedHoodie || null,
    equippedPants: userData.equippedPants || null,
    equippedShoes: userData.equippedShoes || null,
    pushSubscription: userData.pushSubscription || null,
    lensHandle: userData.lensHandle || null,
    lensAccountId: userData.lensAccountId || null,
    lensTransactionHash: userData.lensTransactionHash || null,
    lensMetadataUri: userData.lensMetadataUri || null,
    followers: userData.followers?.map((f: any) => f.id) || [],
    following: userData.following?.map((f: any) => f.id) || [],
    notifications: [],
    completedChallenges: userData.completedChallenges || [],
    receivedPrivateChallenges: [],
    createdPrivateChallenges: [],
    createdPublicChallenges: [],
    participatingPublicChallenges: [],
    dailyChallenge: userData.dailyChallenge || '0'.repeat(365),
    weeklyChallenge: userData.weeklyChallenge || '0'.repeat(52),
    monthlyChallenge: userData.monthlyChallenge || '0'.repeat(12),
  };
}

// ============================================================================
// BLOCKCHAIN LEADERBOARD
// ============================================================================

export const getBlockchainLeaderboard = async (limit: number = 50): Promise<any[]> => {
  try {
    // Get all users with wallet addresses
    const { data } = await graphqlClient.query({
      query: queries.GET_ALL_USERS_WITH_WALLETS,
      variables: { limit: 1000 }, // Get more users to check balances
    });

    const users = data.queryUser || [];

    if (users.length === 0) {
      return [];
    }

    // Filter users with wallets and get blockchain balances
    const usersWithWallets = users.filter((user: any) => {
      if (!user.wallet || user.wallet.trim() === '') return false;
      // Validate wallet address format (40 hex characters after 0x)
      const walletRegex = /^0x[a-fA-F0-9]{40}$/;
      return walletRegex.test(user.wallet);
    });

    if (usersWithWallets.length === 0) {
      return [];
    }

    // Get blockchain balances for all users with wallets
    const usersWithBalances = await Promise.all(
      usersWithWallets.map(async (user: any) => {
        try {
          // Create public client for reading blockchain data
          const publicClient = createPublicClient({
            chain: defineChain(FLOW_TESTNET_CONFIG),
            transport: http(),
          });

          // Get NCT token balance with error handling
          let balance = 0n;
          try {
            console.log(`🔍 Checking balance for wallet: ${user.wallet}`);
            balance = (await publicClient.readContract({
              address: CONTRACTS.Nocenite as `0x${string}`,
              abi: noceniteTokenArtifact,
              functionName: 'balanceOf',
              args: [user.wallet],
            })) as bigint;
            console.log(`💰 Balance for ${user.wallet}: ${balance.toString()}`);
          } catch (error) {
            // Silently handle errors and return 0 balance
            console.error(`❌ Error getting balance for ${user.wallet}:`, error);
            balance = 0n;
          }

          // Convert from wei to tokens (18 decimals)
          const balanceInTokens = Number(balance) / Math.pow(10, 18);

          return {
            ...user,
            balance: Math.floor(balanceInTokens),
          };
        } catch (error) {
          console.error(`Error fetching balance for ${user.wallet}:`, error);
          return { ...user, balance: 0 };
        }
      })
    );

    // Filter out users with 0 balance and sort by balance
    return usersWithBalances
      .filter((user: any) => user.balance > 0)
      .sort((a: any, b: any) => b.balance - a.balance)
      .slice(0, limit)
      .map((user: any, index: number) => ({
        rank: index + 1,
        userId: user.id,
        username: user.username,
        profilePicture: user.profilePicture || '/images/profile.png',
        currentPeriodTokens: user.balance,
        allTimeTokens: user.balance,
        todayTokens: 0,
        weekTokens: 0,
        monthTokens: 0,
        lastUpdate: new Date().toISOString(),
      }));
  } catch (error) {
    console.error('Error in getBlockchainLeaderboard:', error);
    throw error;
  }
};
