import graphqlClient from '../../client';
import { FETCH_UNREAD_NOTIFICATIONS_COUNT } from './queries';
import { MARK_NOTIFICATIONS_AS_READ } from './mutations';
import * as mutations from './mutations';
import { generateId } from '../../utils';

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

/**
 * Create a new notification for a user
 * NOTE: Not currently used - using dgraph.ts createNotification instead
 */
export async function createNotification(data: {
  userId: string;
  triggeredById: string;
  content: string;
  notificationType: string;
  privateChallengeId?: string;
}): Promise<any> {
  try {
    const notificationId = generateId();

    const input: any = {
      id: notificationId,
      userId: data.userId,
      triggeredById: data.triggeredById,
      content: data.content,
      notificationType: data.notificationType,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    if (data.privateChallengeId) {
      input.privateChallenge = { id: data.privateChallengeId };
    }

    const { data: result } = await graphqlClient.mutate({
      mutation: mutations.CREATE_NOTIFICATION,
      variables: { input },
    });

    return result.addNotification.notification[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}
