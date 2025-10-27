import graphqlClient from '../../client';
import { generateId, normalizeWallet } from '../../utils';
import * as queries from './queries';
import * as mutations from './mutations';
import { createPublicClient, defineChain, http } from 'viem';
import { CONTRACTS, FLOW_TESTNET_CONFIG } from '../../../constants';
import noceniteTokenArtifact from '../../../../lib/contracts/nocenite.json';
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
