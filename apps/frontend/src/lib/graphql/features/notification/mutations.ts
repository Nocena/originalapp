import { gql } from '@apollo/client';
import { NOTIFICATION_FIELDS } from '../../fragments';

export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($input: AddNotificationInput!) {
    addNotification(input: [$input]) {
      notification {
        ...NotificationFields
      }
    }
  }
  ${NOTIFICATION_FIELDS}
`;

export const MARK_NOTIFICATIONS_AS_READ = gql`
    mutation MarkAllNotificationsRead($userLensAccountId: String!) {
        updateNotification(
            input: {
                filter: {
                    userLensAccountId: { eq: $userLensAccountId },
                    isRead: false
                },
                set: { isRead: true }
            }
        ) {
            numUids
        }
    }
`;