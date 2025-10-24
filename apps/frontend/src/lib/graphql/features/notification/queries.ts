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

// GraphQL query using fragment
export const FETCH_NOTIFICATIONS = gql`
    query FetchNotifications($userLensAccountId: String!) {
        queryNotification(filter: { userLensAccountId: { eq: $userLensAccountId } }) {
            id
            content
            notificationType
            isRead
            createdAt
            triggeredBy {
                id
                username
                profilePicture
                wallet
            }
            privateChallenge {
                id
                title
                description
            }
            publicChallenge {
                id
                title
                description
            }
            aiChallenge {
                id
                title
                description
                frequency
            }
        }
    }
`;
