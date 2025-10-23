/**
 * Notification API
 *
 * GraphQL operations for creating and managing notifications.
 * NOTE: Currently not used - using dgraph.ts functions instead.
 */

import graphqlClient from '../../client';
import * as mutations from './mutations';
import { generateId } from '../../utils';

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
