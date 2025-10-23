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
