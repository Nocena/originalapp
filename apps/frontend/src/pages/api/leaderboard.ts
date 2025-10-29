// pages/api/leaderboard.ts
import { getLeaderboard, getBlockchainLeaderboard } from '../../lib/graphql';

export default async function handler(req: any, res: any) {
  console.log('🔥 API /leaderboard called with method:', req.method);
  console.log('🔥 Query params:', req.query);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      period = 'all-time',
      limit = 50,
      source = 'database',
      userAddress,
      username,
    } = req.query;
    console.log(
      '🔥 Parsed params - period:',
      period,
      'limit:',
      limit,
      'source:',
      source,
      'userAddress:',
      userAddress,
      'username:',
      username
    );

    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ message: 'Invalid limit. Must be between 1 and 100' });
    }

    let leaderboard;

    if (source === 'blockchain') {
      console.log(
        '🔥 Calling getBlockchainLeaderboard with user address:',
        userAddress,
        'username:',
        username
      );
      try {
        leaderboard = await getBlockchainLeaderboard(limitNum);
        console.log('🔥 getBlockchainLeaderboard returned:', leaderboard?.length || 0, 'items');
      } catch (error) {
        console.error('🔥 Error in getBlockchainLeaderboard:', error);
        leaderboard = [];
      }
    } else {
      console.log('🔥 Calling regular getLeaderboard...');
      leaderboard = await getLeaderboard(period, limitNum);
    }

    console.log('🔥 Final leaderboard length:', leaderboard?.length || 0);

    res.status(200).json({
      success: true,
      source,
      period: source === 'blockchain' ? 'blockchain' : period,
      limit: limitNum,
      leaderboard,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('🔥 Leaderboard API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
