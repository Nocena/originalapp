import { gql } from '@apollo/client';

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