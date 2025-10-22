import { gql } from '@apollo/client';

export const FETCH_UNREAD_NOTIFICATIONS_COUNT = gql`
    query GetUnreadNotifications($userLensAccountId: String!) {
        queryNotification(
            filter: {
                userLensAccountId: { eq: $userLensAccountId }
                isRead: false
            }
        ) {
            id
        }
    }
`;