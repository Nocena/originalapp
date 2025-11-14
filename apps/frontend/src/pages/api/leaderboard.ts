import { NextApiRequest, NextApiResponse } from 'next';
import { lensApolloClient } from '../../pages/_app';
import {
  AccountsBulkDocument,
  AccountsBulkQuery,
  AccountsBulkQueryVariables,
} from '@nocena/indexer';
import graphqlClient from '../../lib/graphql/client';
import { gql } from '@apollo/client';

const CONTRACTS = {
  Nocenite: '0x3FdB92C4974a94E0e867E17e370d79DA6201edc8',
};

// In-memory cache
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const GET_COMPLETION_STATS = gql`
  query GetCompletionStats($startDate: DateTime!) {
    queryChallengeCompletion(filter: { completionDate: { gt: $startDate } }) {
      userLensAccountId
      completionDate
      challengeType
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { limit = 50, source = 'blockchain', period = 'all' } = req.query;

  // Return cached data immediately if available
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return res.status(200).json(cache.data);
  }

  // Handle completion-based leaderboard
  if (source === 'completions') {
    return handleCompletionLeaderboard(req, res, period as string, parseInt(limit as string));
  }

  // Existing token-based leaderboard logic
  try {
    // Add timeout to external API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // Get top NCT holders from Flow testnet Blockscout
    const response = await fetch(
      `https://evm-testnet.flowscan.io/api?module=token&action=getTokenHolders&contractaddress=${CONTRACTS.Nocenite}&page=1&offset=${limit}`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Nocena-App/1.0',
        },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Blockscout API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== '1' || !data.result) {
      throw new Error('Invalid Blockscout API response');
    }

    const holders = data.result;

    // Extract wallet addresses for Lens account lookup (limit to prevent timeout)
    const walletAddresses = holders.slice(0, 10).map((holder: any) => holder.address);
    console.log('🔍 Wallet addresses:', walletAddresses);

    // Query Lens accounts by owner addresses (wallet holding tokens)
    let lensAccounts: any[] = [];
    try {
      console.log('📡 Querying Lens accounts by ownedBy...');

      // Add timeout to Lens query
      const lensPromise = lensApolloClient.query<AccountsBulkQuery, AccountsBulkQueryVariables>({
        query: AccountsBulkDocument,
        variables: {
          request: {
            ownedBy: walletAddresses, // Query by owner (wallet holding tokens)
          },
        },
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      });

      // Race against timeout
      const lensResult = await Promise.race([
        lensPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Lens query timeout')), 10000)
        ),
      ]);

      lensAccounts = (lensResult as any)?.data?.accountsBulk || [];
      console.log('✅ Found', lensAccounts.length, 'Lens accounts');
    } catch (error) {
      console.error('❌ Error fetching Lens accounts (continuing without):', error);
      // Continue without Lens data rather than failing completely
    }

    // Create a map of owner address (wallet) -> Lens account
    const lensAccountMap = new Map();
    lensAccounts.forEach((account: any) => {
      if (account.owner) {
        lensAccountMap.set(account.owner.toLowerCase(), account);
        console.log('📍 Mapped wallet', account.owner, 'to username', account.username?.localName);
      }
    });

    // Process holders and match with Lens accounts
    const leaderboardEntries = holders.map((holder: any, index: number) => {
      const balanceInTokens = Number(holder.value) / Math.pow(10, 18);
      const lensAccount = lensAccountMap.get(holder.address.toLowerCase());

      return {
        rank: index + 1,
        userId: lensAccount?.username?.localName || holder.address,
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

    // Cache the successful result
    const result = {
      success: true,
      leaderboard: leaderboardEntries,
    };

    cache = {
      data: result,
      timestamp: Date.now(),
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);

    // Handle specific timeout errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Request timeout - external service took too long to respond',
          details: 'Blockscout API timeout',
        });
      }

      if (error.message.includes('timeout')) {
        return res.status(504).json({
          success: false,
          error: 'Request timeout',
          details: error.message,
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleCompletionLeaderboard(
  req: NextApiRequest,
  res: NextApiResponse,
  period: string,
  limit: number
) {
  try {
    // Calculate start date based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date('2020-01-01'); // All time
    }

    // Get completions for the period
    const { data } = await graphqlClient.query({
      query: GET_COMPLETION_STATS,
      variables: { startDate: startDate.toISOString() },
      fetchPolicy: 'network-only',
    });

    const completions = data?.queryChallengeCompletion || [];

    // Group completions by user
    const userCompletions = new Map<string, number>();
    completions.forEach((completion: any) => {
      const userId = completion.userLensAccountId;
      userCompletions.set(userId, (userCompletions.get(userId) || 0) + 1);
    });

    // Convert to array and sort by completion count
    const sortedUsers = Array.from(userCompletions.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    // Get Lens account data for top users
    const topUserAddresses = sortedUsers.map(([address]) => address);
    let lensAccounts: any[] = [];

    if (topUserAddresses.length > 0) {
      try {
        // Try both ownedBy (wallet addresses) and direct address lookup
        const [ownedByResult, addressResult] = await Promise.all([
          Promise.race([
            lensApolloClient.query<AccountsBulkQuery, AccountsBulkQueryVariables>({
              query: AccountsBulkDocument,
              variables: {
                request: { ownedBy: topUserAddresses },
              },
              fetchPolicy: 'network-only',
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Lens ownedBy query timeout')), 5000)
            ),
          ]).catch(() => ({ data: { accountsBulk: [] } })),

          Promise.race([
            lensApolloClient.query<AccountsBulkQuery, AccountsBulkQueryVariables>({
              query: AccountsBulkDocument,
              variables: {
                request: { addresses: topUserAddresses },
              },
              fetchPolicy: 'network-only',
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Lens address query timeout')), 5000)
            ),
          ]).catch(() => ({ data: { accountsBulk: [] } })),
        ]);

        const ownedByAccounts = (ownedByResult as any)?.data?.accountsBulk || [];
        const addressAccounts = (addressResult as any)?.data?.accountsBulk || [];

        // Combine both results
        lensAccounts = [...ownedByAccounts, ...addressAccounts];
        console.log('✅ Found', lensAccounts.length, 'Lens accounts');
      } catch (error) {
        console.error('Error fetching Lens accounts:', error);
      }
    }

    // Create lens account map - map by both owner and address
    const lensAccountMap = new Map();
    lensAccounts.forEach((account: any) => {
      if (account.owner) {
        lensAccountMap.set(account.owner.toLowerCase(), account);
      }
      if (account.address) {
        lensAccountMap.set(account.address.toLowerCase(), account);
      }
    });

    // Build leaderboard entries
    const leaderboardEntries = sortedUsers.map(([userAddress, completionCount], index) => {
      const lensAccount = lensAccountMap.get(userAddress.toLowerCase());

      return {
        rank: index + 1,
        userId: lensAccount?.username?.localName || userAddress,
        username:
          lensAccount?.metadata?.name ||
          lensAccount?.username?.value ||
          `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`,
        profilePicture: lensAccount?.metadata?.picture || '/images/profile.png',
        currentPeriodTokens: completionCount,
        allTimeTokens: completionCount,
        todayTokens: completionCount,
        weekTokens: completionCount,
        monthTokens: completionCount,
        lastUpdate: new Date().toISOString(),
        ownerAddress: userAddress,
        completionCount,
      };
    });

    return res.status(200).json({
      success: true,
      leaderboard: leaderboardEntries,
      period,
      type: 'completions',
    });
  } catch (error) {
    console.error('Error fetching completion leaderboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch completion leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
