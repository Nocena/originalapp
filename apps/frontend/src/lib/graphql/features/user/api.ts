import graphqlClient from '../../client';
import { generateId, normalizeWallet } from '../../utils';
import * as queries from './queries';
import * as mutations from './mutations';
import { createPublicClient, defineChain, http } from 'viem';
import { CONTRACTS, FLOW_TESTNET_CONFIG } from '../../../constants';
import noceniteTokenArtifact from '../../../../lib/contracts/nocenite.json';
import {
  AccountsBulkDocument,
  AccountsBulkQuery,
  AccountsBulkQueryVariables,
} from '@nocena/indexer';
import { lensApolloClient } from '../../../../pages/_app';
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
// BLOCKCHAIN LEADERBOARD
// ============================================================================

export const getBlockchainLeaderboard = async (limit: number = 50): Promise<any[]> => {
  try {
    // Get top NCT holders from Flow testnet Blockscout
    const response = await fetch(
      `https://evm-testnet.flowscan.io/api?module=token&action=getTokenHolders&contractaddress=${CONTRACTS.Nocenite}&page=1&offset=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Blockscout API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== '1' || !data.result) {
      throw new Error('Invalid Blockscout API response');
    }

    const holders = data.result;

    // Extract wallet addresses for bulk Lens account lookup
    const walletAddresses = holders.map((holder: any) => holder.address);

    // Query Lens accounts by owner addresses in bulk
    let lensAccounts: any[] = [];
    try {
      const { data: lensData } = await lensApolloClient.query<
        AccountsBulkQuery,
        AccountsBulkQueryVariables
      >({
        query: AccountsBulkDocument,
        variables: {
          request: {
            ownedBy: walletAddresses,
          },
        },
      });

      lensAccounts = lensData?.accountsBulk || [];
    } catch (error) {
      console.error('Error fetching Lens accounts:', error);
    }

    // Create a map of owner address -> Lens account for quick lookup
    const lensAccountMap = new Map();
    lensAccounts.forEach((account: any) => {
      if (account.owner) {
        lensAccountMap.set(account.owner.toLowerCase(), account);
      }
    });

    // Process holders and match with Lens accounts
    const leaderboardEntries = holders.map((holder: any, index: number) => {
      const balanceInTokens = Number(holder.value) / Math.pow(10, 18);
      const lensAccount = lensAccountMap.get(holder.address.toLowerCase());

      return {
        rank: index + 1,
        userId: lensAccount?.username?.localName || holder.address, // Use Lens username for routing
        username:
          lensAccount?.metadata?.name ||
          lensAccount?.username?.value ||
          `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`,
        profilePicture: lensAccount?.metadata?.picture || '/images/profile.png',
        currentPeriodTokens: parseFloat(balanceInTokens.toFixed(1)),
        allTimeTokens: parseFloat(balanceInTokens.toFixed(1)),
        todayTokens: 0,
        weekTokens: 0,
        monthTokens: 0,
        lastUpdate: new Date().toISOString(),
        ownerAddress: holder.address,
      };
    });

    return leaderboardEntries;
  } catch (error) {
    console.error('Error in getBlockchainLeaderboard:', error);
    return [];
  }
};
