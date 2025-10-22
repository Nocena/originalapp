import graphqlClient from '../../client';
import { FETCH_UNREAD_NOTIFICATIONS_COUNT } from './queries';
import { MARK_NOTIFICATIONS_AS_READ } from './mutations';
import * as mutations from '../user/mutations';
// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

export async function fetchUnreadNotificationsCount(
  userLensAccountId: string,
): Promise<number> {
  try {
    const { data } = await graphqlClient.query({
      query: FETCH_UNREAD_NOTIFICATIONS_COUNT,
      variables: { userLensAccountId },
    });

    return data.queryNotification?.length || 0;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    return 0;
  }
}

export async function markNotificationsAsRead(userLensAccountId: string): Promise<boolean> {
  try {
    const { data } = await graphqlClient.mutate(
      {
        mutation: MARK_NOTIFICATIONS_AS_READ,
        variables: { userLensAccountId },
      });

    const numUids = data?.updateNotification?.numUids || 0;
    console.log(`✅ Marked ${numUids} notifications as read.`);
    return true;
  } catch (error) {
    console.error('❌ Error marking notifications as read:', error);
    return false;
  }
}