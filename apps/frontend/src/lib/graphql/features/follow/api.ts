import graphqlClient from '../../client';
import { FETCH_FOLLOWER_COMPLETIONS } from './queries';
import { getDateRange } from './utils';
// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

export async function fetchFollowerCompletions(
  userId: string,
  date: string,
  frequency: 'daily' | 'weekly' | 'monthly'
): Promise<any[]> {
  try {
    const { startDate, endDate } = getDateRange(date, frequency);

    const { data } = await graphqlClient.query({
      query: FETCH_FOLLOWER_COMPLETIONS,
      variables: {
        userId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    const following = data.getUser?.following || [];

    // Transform data into simple array of user + their latest completion
    const completions = following
      .filter((user: any) => user.completedChallenges.length > 0)
      .map((user: any) => ({
        userId: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
        completion: user.completedChallenges[0],
      }));

    return completions;
  } catch (error) {
    console.error('Error fetching follower completions:', error);
    throw error;
  }
}