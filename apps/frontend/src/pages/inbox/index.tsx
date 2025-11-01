// pages/inbox/index.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { fetchNotifications } from '../../lib/api/dgraph';

// Simplified notification fetcher for inbox
const fetchSimpleNotifications = async (userId: string) => {
  const DGRAPH_ENDPOINT =
    process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || 'http://localhost:8080/graphql';

  const query = `
    query getNotifications($userId: String!) {
      queryNotification(filter: { userId: { eq: $userId } }) {
        id
        content
        notificationType
        isRead
        createdAt
        userId
        triggeredById
        status
        expiresAt
        privateChallenge {
          id
          title
          description
          status
          expiresAt
        }
        publicChallenge {
          id
          title
          description
          status
        }
        aiChallenge {
          id
          title
          description
          frequency
        }
        triggeredBy {
          id
          username
          profilePicture
        }
      }
    }
  `;

  try {
    const response = await fetch(DGRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { userId } }),
    });

    if (!response.ok) {
      console.error('Network error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return [];
    }

    return data.data?.queryNotification || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};
import NotificationFollower from './notifications/NotificationFollower';
import NotificationChallenge from './notifications/NotificationChallenge';
import NotificationInviteReward from './notifications/NotificationInviteReward';
import { getPageState, updatePageState } from '@components/PageManager';
import {
  CreatePrivateChallengeRequest,
  NotificationBase,
  PrivateChallengeInvite,
} from '../../types/notifications';
import PrivateChallengeCreator from '../../components/PrivateChallengeCreator';
import ThematicContainer from '../../components/ui/ThematicContainer';

// Performance debugging - global timer for overall page load
const startTime = Date.now();
console.log(`[PERF] InboxView started initializing at ${new Date().toISOString()}`);

// Helper function to check if a challenge is expired
const isExpired = (expiresAt: string | null | undefined): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

// Skeleton component for loading states
const NotificationSkeleton = () => (
  <div className="w-full bg-[#1A2734] rounded-lg p-4 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="h-12 w-12 bg-gray-700 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// Empty state component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="text-gray-400 mb-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 mx-auto mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <p>No notifications yet</p>
    </div>
  </div>
);

// Pull-to-refresh spinner
const PullToRefreshSpinner = () => (
  <div className="w-full flex justify-center items-center py-3">
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
  </div>
);

// Custom event type for PageVisibilityChange
interface CustomVisibilityEvent extends CustomEvent {
  detail: {
    pageName: string;
    isVisible: boolean;
  };
}

// Custom event type for RouteChange
interface CustomRouteEvent extends CustomEvent {
  detail: {
    from: string;
    to: string;
  };
}

const InboxView = () => {
  console.time('inbox-render-total');
  console.log(`[PERF] InboxView component function started at ${Date.now() - startTime}ms`);

  // Debug PageManager state on initialization
  console.log('[PERF] Initial PageManager state:', getPageState());
  if (getPageState()?.notifications?.data) {
    console.log(
      '[PERF] Found notifications in PageManager:',
      getPageState().notifications.data.length,
      'Last fetched:',
      new Date(getPageState().notifications.lastFetched).toLocaleString()
    );
  }

  const { currentLensAccount, isAuthenticated } = useAuth();
  const router = useRouter();
  // Start with loading true for immediate skeleton display
  const [notifications, setNotifications] = useState<NotificationBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [initialRenderComplete, setInitialRenderComplete] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showChallengeCreator, setShowChallengeCreator] = useState(false);
  const [privateChallenges, setPrivateChallenges] = useState<PrivateChallengeInvite[]>([]);
  const [sentChallenges, setSentChallenges] = useState<PrivateChallengeInvite[]>([]);
  const [showReceivedChallenges, setShowReceivedChallenges] = useState(false);
  const [showSentChallenges, setShowSentChallenges] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pulling = useRef(false);
  const dataFetchedRef = useRef(false);

  // Monitor component lifecycle
  useEffect(() => {
    console.log(`[PERF] InboxView mounted at ${new Date().toLocaleTimeString()}`);
    return () => {
      console.log(`[PERF] InboxView unmounted at ${new Date().toLocaleTimeString()}`);
    };
  }, []);

  // Register page visibility event listeners for PageManager
  useEffect(() => {
    console.time('visibility-setup');

    const handlePageVisibility = (event: Event) => {
      const customEvent = event as CustomVisibilityEvent;
      if (customEvent.detail && customEvent.detail.pageName === 'inbox') {
        console.log(`[PERF] Inbox visibility changed to: ${customEvent.detail.isVisible}`);
        setIsVisible(customEvent.detail.isVisible);
      }
    };

    const handleRouteChange = (event: Event) => {
      const customEvent = event as CustomRouteEvent;
      if (customEvent.detail) {
        console.log(`[PERF] Route changed: ${customEvent.detail.from} -> ${customEvent.detail.to}`);
        if (customEvent.detail.to === '/inbox') {
          setIsVisible(true);

          // Mark that user has viewed notifications when navigating to inbox
          localStorage.setItem('nocena_last_notification_view', Date.now().toString());
        } else if (customEvent.detail.from === '/inbox') {
          setIsVisible(false);
        }
      }
    };

    window.addEventListener('pageVisibilityChange', handlePageVisibility);
    window.addEventListener('routeChange', handleRouteChange);

    // Initialize visibility based on current route
    setIsVisible(window.location.pathname === '/inbox');

    console.timeEnd('visibility-setup');

    return () => {
      window.removeEventListener('pageVisibilityChange', handlePageVisibility);
      window.removeEventListener('routeChange', handleRouteChange);
    };
  }, []);

  // First load - check for cached data in PageManager and localStorage
  useEffect(() => {
    console.time('initial-data-load');

    // Mark initial render as complete immediately
    setInitialRenderComplete(true);

    try {
      console.time('cache-check');
      // First try PageManager state
      const pageState = getPageState();
      if (pageState && pageState.notifications) {
        const { data, lastFetched } = pageState.notifications;

        // Only use data if it's not too old (5 minutes)
        if (data && data.length > 0 && Date.now() - lastFetched < 300000) {
          console.log('[PERF] Using cached notifications from PageManager');
          setNotifications(data as NotificationBase[]);
          setIsLoading(false); // Stop loading immediately when we have cached data
          dataFetchedRef.current = true;
        }
      } else {
        // Try localStorage if PageManager doesn't have data
        console.time('localStorage-read');
        const cachedData = localStorage.getItem('nocena_cached_notifications');
        console.timeEnd('localStorage-read');

        if (cachedData) {
          console.time('localStorage-parse');
          const { data, timestamp } = JSON.parse(cachedData);
          console.timeEnd('localStorage-parse');

          if (Date.now() - timestamp < 300000) {
            console.log('[PERF] Using cached notifications from localStorage');
            setNotifications(data);
            setIsLoading(false); // Stop loading immediately when we have cached data
            dataFetchedRef.current = true;

            // Also update PageManager state
            console.time('update-page-state');
            updatePageState('notifications', data);
            console.timeEnd('update-page-state');
          }
        }
      }
      console.timeEnd('cache-check');
    } catch (error) {
      console.error('[PERF] Failed to load cached notifications', error);
    }

    console.timeEnd('initial-data-load');
    console.timeEnd('inbox-render-total');
  }, []);

  // Function to fetch notifications
  const fetchUserNotifications = useCallback(
    async (showLoadingState = true) => {
      if (!currentLensAccount?.address) {
        console.log('[PERF] fetchUserNotifications aborted - no user ID');
        return;
      }

      console.time('fetch-notifications-total');

      if (showLoadingState && !dataFetchedRef.current) {
        setIsLoading(true);
      }

      try {
        console.time('network-request');
        console.log('[PERF] Starting API request to fetch notifications');
        const fetchedNotifications = await fetchSimpleNotifications(currentLensAccount.address);
        console.timeEnd('network-request');
        console.log(`[PERF] API returned ${fetchedNotifications.length} notifications`);

        console.time('process-notifications');
        // Sort notifications by createdAt date (newest first)
        const sortedNotifications = [...fetchedNotifications].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setNotifications(sortedNotifications);
        setIsLoading(false);
        dataFetchedRef.current = true;
        console.timeEnd('process-notifications');

        // Update both PageManager state and localStorage cache
        console.time('update-state');
        updatePageState('notifications', sortedNotifications);

        try {
          localStorage.setItem(
            'nocena_cached_notifications',
            JSON.stringify({
              data: sortedNotifications,
              timestamp: Date.now(),
            })
          );
        } catch (storageError) {
          console.error('[PERF] LocalStorage write failed', storageError);
        }

        // Mark notifications as viewed
        localStorage.setItem('nocena_last_notification_view', Date.now().toString());
        console.timeEnd('update-state');
      } catch (error) {
        console.error('[PERF] Failed to load notifications', error);
        setIsLoading(false);
      } finally {
        if (showLoadingState) setIsLoading(false);
        setIsPulling(false);
        setPullDistance(0);
        console.timeEnd('fetch-notifications-total');
      }
    },
    [currentLensAccount?.address]
  );

  // Handle data fetching based on component visibility and data freshness
  useEffect(() => {
    if (!currentLensAccount?.address || !initialRenderComplete) {
      console.log(
        `[PERF] Data fetch check skipped - user: ${!!currentLensAccount?.address}, initialRender: ${initialRenderComplete}`
      );
      return;
    }

    console.time('should-fetch-check');
    // Get the most recent data timestamp
    const pageState = getPageState();
    const lastFetched = pageState?.notifications?.lastFetched || 0;

    const shouldFetch =
      notifications.length === 0 || // No data
      Date.now() - lastFetched > 60000 || // Data is older than 1 minute
      (isVisible && Date.now() - lastFetched > 30000); // Page is visible and data older than 30 seconds

    console.log(`[PERF] Should fetch data: ${shouldFetch}`, {
      notificationsLength: notifications.length,
      lastFetchedAge: Date.now() - lastFetched,
      isVisible,
    });

    if (shouldFetch) {
      // Only show loading indicator if we have no data yet
      fetchUserNotifications(notifications.length === 0);
    }
    console.timeEnd('should-fetch-check');
  }, [
    currentLensAccount?.address,
    isVisible,
    notifications.length,
    initialRenderComplete,
    fetchUserNotifications,
  ]);

  // Set up background refresh when page is visible
  useEffect(() => {
    if (!isVisible || !currentLensAccount?.address) return;

    console.log('[PERF] Setting up background refresh interval');

    // Use number type for interval ID
    const intervalId: number = window.setInterval(() => {
      console.log('[PERF] Background refresh triggered');
      fetchUserNotifications(false); // Silent background refresh
    }, 30000); // Check every 30 seconds when visible

    // Add to tracking for memory optimization
    if (typeof window !== 'undefined' && window.nocena_app_timers) {
      window.nocena_app_timers.push(intervalId);
    }

    return () => window.clearInterval(intervalId);
  }, [isVisible, currentLensAccount?.address, fetchUserNotifications]);

  // Listen for app foreground/background events
  useEffect(() => {
    const handleAppForeground = () => {
      console.log('[PERF] App came to foreground');
      if (isVisible && currentLensAccount?.address) {
        // Refresh data when app comes to foreground and this page is visible
        fetchUserNotifications(false);
      }
    };

    window.addEventListener('nocena_app_foreground', handleAppForeground);

    return () => {
      window.removeEventListener('nocena_app_foreground', handleAppForeground);
    };
  }, [isVisible, currentLensAccount?.address, fetchUserNotifications]);

  // Fetch private challenges when component mounts
  useEffect(() => {
    if (currentLensAccount?.address) {
      fetchPrivateChallenges();
      fetchSentChallenges();
    }
  }, [currentLensAccount?.address]);

  // Setup pull-to-refresh functionality
  useEffect(() => {
    if (!contentRef.current) return;

    console.log('[PERF] Setting up pull-to-refresh handlers');
    const container = contentRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when scrolled to top
      if (container.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return;

      currentY.current = e.touches[0].clientY;
      const pullDist = Math.max(0, currentY.current - startY.current);

      // Resistance factor - the pull distance isn't 1:1 with finger movement
      const resistance = 0.4;
      const displayDistance = Math.round(pullDist * resistance);

      if (displayDistance > 0) {
        e.preventDefault(); // Prevent default scrolling
        setPullDistance(displayDistance);

        // Show visual indicator when pulled enough to refresh
        if (displayDistance > 60) {
          setIsPulling(true);
        }
      }
    };

    const handleTouchEnd = () => {
      if (!pulling.current) return;

      // If pulled far enough, trigger refresh
      if (pullDistance > 60) {
        fetchUserNotifications(true);
      } else {
        // Reset pull state
        setIsPulling(false);
        setPullDistance(0);
      }

      pulling.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, fetchUserNotifications]);

  // Helper function to determine reward amount based on notification type
  const getRewardForNotification = (notification: NotificationBase) => {
    // Default reward
    let reward = 10;

    // Try to get reward from challenge if available
    if (notification.privateChallenge) {
      // Assume private challenges have a standard reward of 15
      reward = 15;
    } else if (notification.publicChallenge) {
      // Assume public challenges have a standard reward of 20
      reward = 20;
    } else if (notification.aiChallenge) {
      // Assign reward based on frequency
      switch (notification.aiChallenge.frequency) {
        case 'daily':
          reward = 5;
          break;
        case 'weekly':
          reward = 15;
          break;
        case 'monthly':
          reward = 25;
          break;
        default:
          reward = 10;
      }
    }

    return reward;
  };

  // Private challenge handlers
  const handleCreateChallenge = () => {
    setShowChallengeCreator(true);
  };

  const fetchPrivateChallenges = async () => {
    if (!currentLensAccount?.address) return;

    console.log('Fetching challenges for user ID:', currentLensAccount?.address);

    try {
      const response = await fetch(
        `/api/private-challenge/list?userId=${currentLensAccount?.address}`
      );
      const result = await response.json();

      if (response.ok) {
        // Show pending and completed challenges
        const activeChallenges = result.challenges.filter(
          (challenge: PrivateChallengeInvite) =>
            challenge.status === 'pending' || challenge.status === 'completed'
        );
        setPrivateChallenges(activeChallenges);
      } else {
        console.error('Failed to fetch private challenges:', result.error);
      }
    } catch (error) {
      console.error('Error fetching private challenges:', error);
    }
  };

  const handleChallengeResponse = async (challengeId: string, action: 'accept' | 'reject') => {
    if (!currentLensAccount?.address) return;

    console.log('Responding to challenge:', {
      challengeId,
      action,
      userId: currentLensAccount?.address,
    });

    // Handle accept by navigating to completion (no status change yet)
    if (action === 'accept') {
      const challenge = privateChallenges.find((c) => c.id === challengeId);
      if (challenge) {
        router.push({
          pathname: '/completing',
          query: {
            type: 'PRIVATE',
            title: challenge.name,
            description: challenge.description,
            reward: challenge.rewardAmount.toString(),
            challengeId: challenge.id,
            creatorWalletAddress: challenge.creatorWalletAddress,
          },
        });
      }
      return;
    }

    // Handle reject by updating status
    try {
      // TODO: fix it
      const response = await fetch('/api/private-challenge/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          action,
          userId: currentLensAccount?.address,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`Challenge ${action}ed:`, result);
        // Refresh challenge list to update UI
        fetchPrivateChallenges();
      } else {
        console.error(`Failed to ${action} challenge:`, result.error);
      }
    } catch (error) {
      console.error(`Error ${action}ing challenge:`, error);
    }
  };

  const fetchSentChallenges = async () => {
    if (!currentLensAccount?.address) return;

    try {
      const response = await fetch(
        `/api/private-challenge/sent?userId=${currentLensAccount?.address}`
      );
      const result = await response.json();

      if (response.ok) {
        // Filter out cleared challenges
        const activeChallenges = result.challenges.filter(
          (challenge: PrivateChallengeInvite) => challenge.status !== 'cleared'
        );
        setSentChallenges(activeChallenges);
      } else {
        console.error('Failed to fetch sent challenges:', result.error);
      }
    } catch (error) {
      console.error('Error fetching sent challenges:', error);
    }
  };

  const clearCompletedChallenges = async () => {
    if (!currentLensAccount?.address) return;

    try {
      const response = await fetch('/api/private-challenge/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentLensAccount?.address }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`Cleared ${result.clearedCount} completed challenges`);
        // Refresh both sent and received challenges to update UI
        fetchSentChallenges();
        fetchPrivateChallenges();
      } else {
        console.error('Failed to clear challenges:', result.error);
      }
    } catch (error) {
      console.error('Error clearing challenges:', error);
    }
  };

  const handleSubmitChallenge = async (
    challenge: CreatePrivateChallengeRequest /* & { selectedUser: any }*/
  ) => {
    if (!currentLensAccount?.address) {
      console.error('User not authenticated');
      return;
    }

    console.log('Challenge data:', challenge);
    // console.log('Selected user:', challenge.selectedUser);

    try {
      // TODO: fix it
      /*
      const response = await fetch('/api/private-challenge/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...challenge,
          creatorId: currentLensAccount?.address,
          creatorWalletAddress: user.wallet,
          creatorUsername: user.username,
          creatorProfilePicture: user.profilePicture || '/images/profile.png',
          recipientUsername: challenge.selectedUser?.username || 'Unknown',
          recipientWalletAddress: challenge.selectedUser?.wallet,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Private challenge created:', result);
        // Refresh both challenge lists
        fetchPrivateChallenges();
        fetchSentChallenges();
      } else {
        console.error('Failed to create challenge:', result.error);
        // TODO: Show error message
      }
*/
    } catch (error) {
      console.error('Error creating private challenge:', error);
      // TODO: Show error message
    } finally {
      setShowChallengeCreator(false);
    }
  };

  // Memoize notification rendering to prevent unnecessary re-renders
  const notificationList = useMemo(() => {
    console.time('render-notification-list');
    const result = notifications.map((notification) => {
      // Handle invite reward notifications
      if (notification.notificationType === 'invite_used') {
        return (
          <NotificationInviteReward
            key={notification.id}
            friendUsername={notification.triggeredBy?.username ?? 'Unknown'}
            friendProfilePicture={notification.triggeredBy?.profilePicture ?? '/images/profile.png'}
            friendId={notification.triggeredBy?.id}
            notification={notification}
          />
        );
      }
      // Handle follow notifications
      else if (notification.notificationType === 'follow') {
        return (
          <NotificationFollower
            key={notification.id}
            username={notification.triggeredBy?.username ?? 'Unknown'}
            profilePicture={notification.triggeredBy?.profilePicture ?? '/images/profile.png'}
            id={notification.triggeredBy?.id}
            notification={notification}
          />
        );
      }
      // Handle challenge and other notification types
      else {
        let challengeTitle = notification.content ?? '';

        // Use the title from the specific challenge if available
        if (notification.privateChallenge) {
          challengeTitle = notification.privateChallenge.title || challengeTitle;
        } else if (notification.publicChallenge) {
          challengeTitle = notification.publicChallenge.title || challengeTitle;
        } else if (notification.aiChallenge) {
          challengeTitle = notification.aiChallenge.title || challengeTitle;
        }

        // Get reward amount - could be determined by challenge type
        const rewardAmount = getRewardForNotification(notification);

        return (
          <NotificationChallenge
            key={notification.id}
            title={challengeTitle}
            challengerName={notification.triggeredBy?.username ?? 'Unknown'}
            challengerProfile={notification.triggeredBy?.profilePicture ?? '/images/profile.png'}
            reward={rewardAmount}
            notification={notification}
          />
        );
      }
    });
    console.timeEnd('render-notification-list');
    return result;
  }, [notifications]);

  // For initial render with no data, show skeletons
  console.log(
    `[PERF] Render decision - isLoading: ${isLoading}, notifications: ${notifications.length}`
  );

  if (isLoading) {
    console.log('[PERF] Rendering skeleton view');
    return (
      <div className="text-white p-4 min-h-screen flex items-center justify-center mt-20">
        <div className="flex flex-col items-center w-full h-full max-w-md mx-auto">
          <div className="w-full space-y-4 p-6">
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <NotificationSkeleton key={`skeleton-${index}`} />
              ))}
          </div>
        </div>
      </div>
    );
  }

  console.log('[PERF] Rendering main inbox content');
  return (
    <div className="text-white p-4 min-h-screen mt-20">
      <div
        id="inbox-page"
        ref={contentRef}
        className="max-w-md mx-auto"
        style={{
          paddingTop: `${pullDistance}px`, // Only pull distance for pull-to-refresh
        }}
      >
        {/* Pull to refresh indicator */}
        {isPulling && (
          <div
            className="absolute top-20 left-0 right-0 flex justify-center items-center z-10"
            style={{ height: `${pullDistance}px` }}
          >
            <PullToRefreshSpinner />
          </div>
        )}

        {/* Received Challenges Section */}
        <div className="mb-3 mt-12">
          <ThematicContainer
            asButton={false}
            glassmorphic={true}
            color="nocenaBlue"
            rounded="xl"
            className="p-4 mb-4"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowReceivedChallenges(!showReceivedChallenges)}
                className="flex items-center space-x-2 text-xl font-semibold hover:text-blue-300 transition-colors"
              >
                <span>Received Challenges</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${showReceivedChallenges ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">{privateChallenges.length} received</span>
              </div>
            </div>
          </ThematicContainer>

          {/* Collapsible received challenge list */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showReceivedChallenges ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {privateChallenges.some(
              (c) =>
                ['completed', 'rejected', 'expired', 'failed'].includes(c.status) ||
                isExpired(c.expiresAt)
            ) && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={clearCompletedChallenges}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                >
                  Clear Notifications
                </button>
              </div>
            )}
            {privateChallenges.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No challenges received yet</div>
            ) : (
              <div className="space-y-3">
                {privateChallenges.map((challenge) => {
                  const expired = isExpired(challenge.expiresAt);
                  return (
                    <ThematicContainer
                      key={challenge.id}
                      asButton={false}
                      glassmorphic={true}
                      color="nocenaBlue"
                      rounded="xl"
                      className="p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{challenge.name}</h3>
                          {challenge.status === 'completed' && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            challenge.status === 'pending'
                              ? 'bg-yellow-600'
                              : challenge.status === 'accepted'
                                ? 'bg-blue-600'
                                : challenge.status === 'completed'
                                  ? 'bg-green-600'
                                  : challenge.status === 'rejected'
                                    ? 'bg-red-600'
                                    : challenge.status === 'expired'
                                      ? 'bg-gray-600'
                                      : challenge.status === 'failed'
                                        ? 'bg-orange-600'
                                        : 'bg-gray-600'
                          }`}
                        >
                          {challenge.status}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{challenge.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          From{' '}
                          <button
                            onClick={() => router.push(`/profile/${challenge.creatorId}`)}
                            className="text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            @{challenge.creatorUsername}
                          </button>
                        </span>
                        {challenge.status === 'pending' && challenge.expiresAt && (
                          <span
                            className={`text-xs ${expired ? 'text-red-400' : 'text-yellow-400'}`}
                          >
                            {expired
                              ? 'EXPIRED'
                              : `Expires: ${new Date(challenge.expiresAt).toLocaleString()}`}
                          </span>
                        )}
                        {challenge.status === 'completed' && (
                          <span className="text-xs text-gray-400">
                            Recipient: +{challenge.rewardAmount} NCT • Creator: +
                            {Math.floor(challenge.rewardAmount * 0.1)} NCT
                          </span>
                        )}
                      </div>
                      {challenge.status === 'pending' && (
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => handleChallengeResponse(challenge.id, 'reject')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleChallengeResponse(challenge.id, 'accept')}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-sm transition-colors"
                          >
                            Accept
                          </button>
                        </div>
                      )}
                    </ThematicContainer>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sent Challenges Section */}
        <div className="mb-6">
          <ThematicContainer
            asButton={false}
            glassmorphic={true}
            color="nocenaPink"
            rounded="xl"
            className="p-4 mb-4"
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowSentChallenges(!showSentChallenges)}
                className="flex items-center space-x-2 text-xl font-semibold hover:text-pink-300 transition-colors"
              >
                <span>Sent Challenges</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${showSentChallenges ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">{sentChallenges.length} sent</span>
              </div>
            </div>
          </ThematicContainer>

          {/* Collapsible sent challenge list */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showSentChallenges ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {sentChallenges.some(
              (c) =>
                ['completed', 'rejected', 'expired', 'failed'].includes(c.status) ||
                isExpired(c.expiresAt)
            ) && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={clearCompletedChallenges}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                >
                  Clear Notifications
                </button>
              </div>
            )}
            {sentChallenges.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No challenges sent yet</div>
            ) : (
              <div className="space-y-3">
                {sentChallenges.map((challenge) => {
                  const expired = isExpired(challenge.expiresAt);
                  return (
                    <ThematicContainer
                      key={challenge.id}
                      asButton={false}
                      glassmorphic={true}
                      color="nocenaPink"
                      rounded="xl"
                      className="p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{challenge.name}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            challenge.status === 'pending'
                              ? 'bg-yellow-600'
                              : challenge.status === 'accepted'
                                ? 'bg-blue-600'
                                : challenge.status === 'completed'
                                  ? 'bg-green-600'
                                  : challenge.status === 'rejected'
                                    ? 'bg-red-600'
                                    : challenge.status === 'expired'
                                      ? 'bg-gray-600'
                                      : challenge.status === 'failed'
                                        ? 'bg-orange-600'
                                        : 'bg-gray-600'
                          }`}
                        >
                          {challenge.status}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{challenge.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Sent to{' '}
                          <button
                            onClick={() => router.push(`/profile/${challenge.recipientId}`)}
                            className="text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            @{challenge.recipientUsername}
                          </button>
                        </span>
                        {challenge.status === 'pending' && challenge.expiresAt && (
                          <span
                            className={`text-xs ${expired ? 'text-red-400' : 'text-yellow-400'}`}
                          >
                            {expired
                              ? 'EXPIRED'
                              : `Expires: ${new Date(challenge.expiresAt).toLocaleString()}`}
                          </span>
                        )}
                        {challenge.status === 'completed' && (
                          <span className="text-xs text-gray-400">
                            Recipient: +{challenge.rewardAmount} NCT • Creator: +
                            {Math.floor(challenge.rewardAmount * 0.1)} NCT
                          </span>
                        )}
                      </div>
                    </ThematicContainer>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="w-full space-y-4 pb-32">
          {notifications.length === 0 ? (
            // Empty state when no notifications
            <EmptyState />
          ) : (
            // Actual notifications
            notificationList
          )}
        </div>
      </div>

      {/* Private Challenge Creator Modal */}
      {showChallengeCreator && (
        <PrivateChallengeCreator
          onClose={() => setShowChallengeCreator(false)}
          onSubmit={handleSubmitChallenge}
        />
      )}
    </div>
  );
};

export default InboxView;
