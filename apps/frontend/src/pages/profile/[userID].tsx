import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useActiveAccount } from 'thirdweb/react';
import { createPublicClient, defineChain, http } from 'viem';

import { toggleFollowUser } from '../../lib/graphql';
import { useAuth } from '../../contexts/AuthContext';
import { useAccountQuery } from '@nocena/indexer';
import { getPageState, updatePageState } from '../../components/PageManager';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicContainer from '../../components/ui/ThematicContainer';
import FollowersPopup from './components/FollowersPopup';
import TrailerSection from './components/AvatarSection';
import StatsSection from './components/StatsSection';
import CalendarSection from './components/CalendarSection';
import PrivateChallengeCreator from '../../components/PrivateChallengeCreator';
import type { AccountFragment } from '@nocena/indexer';
import { CONTRACTS, FLOW_TESTNET_CONFIG } from '../../lib/constants';
import noceniteTokenArtifact from '../../lib/contracts/nocenite.json';

const defaultProfilePic = '/images/profile.png';
const nocenix = '/nocenix.ico';

// Local User interface for profile page
interface ProfileUser {
  id: string;
  username: string;
  profilePicture: string;
  coverPhoto?: string;
  trailerVideo?: string;
  bio: string;
  earnedTokens: number;
  dailyChallenge: string;
  weeklyChallenge: string;
  monthlyChallenge: string;
  followers: string[]; // Array of user IDs
}

// Interface for follower data that could be string or object
type FollowerData = string | { id: string; [key: string]: any };

const OtherProfileView: React.FC = () => {
  const router = useRouter();
  const { userID } = router.query;
  const { currentLensAccount } = useAuth();
  const activeAccount = useActiveAccount();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPendingFollow, setIsPendingFollow] = useState(false);
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [showPrivateChallengeCreator, setShowPrivateChallengeCreator] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<'trailer' | 'calendar' | 'achievements'>(
    'trailer'
  );
  const [nctBalance, setNctBalance] = useState<number | null>(null);
  const [nctLoading, setNctLoading] = useState(false);

  // Fetch Lens account for the user
  const {
    data: lensData,
    loading: lensLoading,
    error: lensError,
  } = useAccountQuery({
    variables: {
      request: { address: userID as string },
    },
    skip: !userID,
  });

  // Log Lens query status
  useEffect(() => {
    if (userID) {
      console.log('Lens query status:', {
        userID,
        lensLoading,
        lensError: lensError?.message,
        hasData: !!lensData,
        hasAccount: !!lensData?.account,
      });
    }
  }, [userID, lensLoading, lensError, lensData]);

  // Fetch NCT balance when owner address is available
  useEffect(() => {
    const fetchNctBalance = async () => {
      const ownerAddress = lensData?.account?.owner;
      if (!ownerAddress) return;

      setNctLoading(true);
      try {
        const publicClient = createPublicClient({
          chain: defineChain(FLOW_TESTNET_CONFIG),
          transport: http(),
        });

        const balance = (await publicClient.readContract({
          address: CONTRACTS.Nocenite as `0x${string}`,
          abi: noceniteTokenArtifact,
          functionName: 'balanceOf',
          args: [ownerAddress],
        })) as bigint;

        const balanceInTokens = Number(balance) / Math.pow(10, 18);
        setNctBalance(balanceInTokens);
      } catch (error) {
        console.error('Error fetching NCT balance:', error);
        setNctBalance(0);
      } finally {
        setNctLoading(false);
      }
    };

    fetchNctBalance();
  }, [lensData?.account?.owner]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Check if this page is visible in the PageManager
  useEffect(() => {
    if (!userID) return;

    const profilePath = `/profile/${userID}`;

    const handleVisibilityChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.pageName === 'profile') {
        setIsPageVisible(customEvent.detail.isVisible);
      }
    };

    const handleRouteChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.to === profilePath) {
          setIsPageVisible(true);
        } else if (customEvent.detail.from === profilePath) {
          setIsPageVisible(false);
        }
      }
    };

    window.addEventListener('pageVisibilityChange', handleVisibilityChange);
    window.addEventListener('routeChange', handleRouteChange);

    // Initialize visibility based on current route
    setIsPageVisible(window.location.pathname === profilePath);

    return () => {
      window.removeEventListener('pageVisibilityChange', handleVisibilityChange);
      window.removeEventListener('routeChange', handleRouteChange);
    };
  }, [userID]);

  // Function to fetch user data with caching
  const fetchUserData = useCallback(async (userId: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      // Try to get from PageManager first
      const pageState = getPageState();
      const profileCacheKey = `other_profile_${userId}`;

      // Check if we have fresh data in PageManager
      if (
        pageState &&
        pageState[profileCacheKey] &&
        Date.now() - pageState[profileCacheKey].lastFetched < 300000
      ) {
        const cachedUser = pageState[profileCacheKey].data;
        if (cachedUser && cachedUser.id) {
          setUser(cachedUser as ProfileUser);
          setError(null);
          if (!showLoading) return; // Skip API call if silent refresh
        }
      } else {
        // Try localStorage if PageManager doesn't have data
        const cachedData = localStorage.getItem(`nocena_${profileCacheKey}`);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (data && data.id && Date.now() - timestamp < 300000) {
            setUser(data as ProfileUser);
            setError(null);
            if (!showLoading) return; // Skip API call if silent refresh
          }
        }
      }

      // Use Lens account data if available
      console.log('Lens query result:', { lensData, userId, hasAccount: !!lensData?.account });

      if (lensData?.account) {
        const lensAccount = lensData.account;
        const profileUser: ProfileUser = {
          id: lensAccount.address,
          username: lensAccount.username?.localName || 'Anonymous',
          profilePicture: lensAccount.metadata?.picture || defaultProfilePic,
          coverPhoto: lensAccount.metadata?.coverPicture || '/images/cover.jpg',
          trailerVideo: '/trailer.mp4',
          bio: lensAccount.metadata?.bio || '',
          earnedTokens: 0, // TODO: Requires wallet address in Dgraph to fetch NCT balance
          dailyChallenge: '0'.repeat(365),
          weeklyChallenge: '0'.repeat(52),
          monthlyChallenge: '0'.repeat(12),
          followers: [],
        };

        setUser(profileUser);
        updatePageState('profile', { user: profileUser, timestamp: Date.now() });
        return;
      }

      // Fallback if no Lens data
      console.error('No Lens account found for:', userId);
      setError(new Error('User not found'));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching full user data:', error);
      setError(error instanceof Error ? error : new Error('An unknown error occurred'));
    } finally {
      if (showLoading) setIsLoading(false);
      setInitialDataLoaded(true);
    }
  }, []);

  // Initial data fetch and setup background refresh
  useEffect(() => {
    if (!userID) return;

    // Try to load from cache first (this will show UI immediately)
    const userId = userID as string;
    const profileCacheKey = `other_profile_${userId}`;

    try {
      // First try PageManager state
      const pageState = getPageState();
      if (pageState && pageState[profileCacheKey]) {
        const cachedUser = pageState[profileCacheKey].data;
        setUser(cachedUser as ProfileUser);
      } else {
        // Try localStorage as fallback
        const cachedData = localStorage.getItem(`nocena_${profileCacheKey}`);
        if (cachedData) {
          const { data } = JSON.parse(cachedData);
          setUser(data as ProfileUser);
        }
      }
    } catch (error) {
      console.error('Error loading cached profile data', error);
    }

    // Fetch fresh data
    fetchUserData(userId, true);

    // Set up background refresh when page is visible
    const refreshInterval = setInterval(() => {
      if (isPageVisible) {
        fetchUserData(userId, false); // Silent refresh
      }
    }, 300000); // Every 5 minutes

    // Add to tracking for memory optimization
    if (typeof window !== 'undefined' && window.nocena_app_timers) {
      window.nocena_app_timers.push(refreshInterval as unknown as number);
    }

    return () => clearInterval(refreshInterval);
  }, [userID, isPageVisible, fetchUserData]);

  useEffect(() => {
    if (scrollContainerRef.current && user) {
      const currentMonthIndex = new Date().getMonth();
      const elementWidth = scrollContainerRef.current.scrollWidth / 12;
      scrollContainerRef.current.scrollLeft =
        elementWidth * currentMonthIndex -
        scrollContainerRef.current.clientWidth / 2 +
        elementWidth / 2;
    }
  }, [user]);

  // React to app foreground events
  useEffect(() => {
    const handleAppForeground = () => {
      if (isPageVisible && userID) {
        fetchUserData(userID as string, false); // Silent refresh when app comes to foreground
      }
    };

    window.addEventListener('nocena_app_foreground', handleAppForeground);

    return () => {
      window.removeEventListener('nocena_app_foreground', handleAppForeground);
    };
  }, [isPageVisible, userID, fetchUserData]);

  const handleFollowToggle = async () => {
    if (!currentLensAccount || !user || isPendingFollow) return;

    // Set pending state
    setIsPendingFollow(true);

    // Optimistically update UI
    /*
    setUser((prevUser) => {
      if (!prevUser) return null;

      const isCurrentlyFollowing = prevUser.followers.includes(currentUser.id);
      const updatedFollowers = isCurrentlyFollowing
        ? prevUser.followers.filter((id) => id !== currentUser.id)
        : [...prevUser.followers, currentUser.id];

      return {
        ...prevUser,
        followers: updatedFollowers,
      };
    });
*/

    // Also update the cached state
    /*
    if (user) {
      const profileCacheKey = `other_profile_${user.id}`;
      const isCurrentlyFollowing = user.followers.includes(currentUser.id);
      const updatedFollowers = isCurrentlyFollowing
        ? user.followers.filter((id) => id !== currentUser.id)
        : [...user.followers, currentUser.id];

      const updatedUser = {
        ...user,
        followers: updatedFollowers,
      };

      // Update PageManager state
      updatePageState(profileCacheKey, updatedUser);

      // Update localStorage
      localStorage.setItem(
        `nocena_${profileCacheKey}`,
        JSON.stringify({
          data: updatedUser,
          timestamp: Date.now(),
        })
      );
    }
*/

    /*
    try {
      // Make API call
      const wasFollowing = user.followers.includes(currentUser.id);
      const success = await toggleFollowUser(currentUser.id, user.id, wasFollowing);

      // If API call fails, revert the UI change
      if (!success) {
        setUser((prevUser) => {
          if (!prevUser) return null;

          const isCurrentlyFollowing = prevUser.followers.includes(currentUser.id);
          const updatedFollowers = isCurrentlyFollowing
            ? prevUser.followers.filter((id) => id !== currentUser.id)
            : [...prevUser.followers, currentUser.id];

          return {
            ...prevUser,
            followers: updatedFollowers,
          };
        });

        // Also revert the cached state
        if (user) {
          const profileCacheKey = `other_profile_${user.id}`;
          const isCurrentlyFollowing = user.followers.includes(currentUser.id);
          const updatedFollowers = isCurrentlyFollowing
            ? user.followers.filter((id) => id !== currentUser.id)
            : [...user.followers, currentUser.id];

          const updatedUser = {
            ...user,
            followers: updatedFollowers,
          };

          // Update PageManager state
          updatePageState(profileCacheKey, updatedUser);

          // Update localStorage
          localStorage.setItem(
            `nocena_${profileCacheKey}`,
            JSON.stringify({
              data: updatedUser,
              timestamp: Date.now(),
            })
          );
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);

      // Revert UI change on error
      setUser((prevUser) => {
        if (!prevUser) return null;

        const isCurrentlyFollowing = prevUser.followers.includes(currentUser.id);
        const updatedFollowers = isCurrentlyFollowing
          ? prevUser.followers.filter((id) => id !== currentUser.id)
          : [...prevUser.followers, currentUser.id];

        return {
          ...prevUser,
          followers: updatedFollowers,
        };
      });
    } finally {
      setIsPendingFollow(false);
    }
*/
  };

  // Handle "Challenge Me" button click
  const handleChallengeClick = () => {
    if (!user || !currentLensAccount) return;
    setShowPrivateChallengeCreator(true);
  };

  // Handle followers click
  const handleFollowersClick = () => {
    setShowFollowersPopup(true);
  };

  // Calculate stats for components
  const currentStreak = useMemo(() => {
    if (!user) return 0;
    const dailyChallenges = user.dailyChallenge.split('').map((char) => char === '1');
    let streak = 0;
    for (let i = dailyChallenges.length - 1; i >= 0; i--) {
      if (dailyChallenges[i]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [user]);

  const totalChallenges = useMemo(() => {
    if (!user) return 0;
    const dailyChallenges = user.dailyChallenge.split('').map((char) => char === '1');
    const weeklyChallenges = user.weeklyChallenge.split('').map((char) => char === '1');
    const monthlyChallenges = user.monthlyChallenge.split('').map((char) => char === '1');

    return (
      dailyChallenges.filter(Boolean).length +
      weeklyChallenges.filter(Boolean).length +
      monthlyChallenges.filter(Boolean).length
    );
  }, [user]);

  const getButtonColor = (section: string) => {
    switch (section) {
      case 'trailer':
        return 'nocenaPink';
      case 'calendar':
        return 'nocenaPurple';
      case 'achievements':
        return 'nocenaBlue';
      default:
        return 'nocenaBlue';
    }
  };

  // Show loading state only if we don't have any cached data at all
  if (isLoading && !user) {
    return (
      <div
        className="fixed inset-0 text-white overflow-y-auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          width: '100vw',
          height: '100vh',
        }}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && initialDataLoaded) {
    return (
      <div
        className="fixed inset-0 text-white overflow-y-auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          width: '100vw',
          height: '100vh',
        }}
      >
        <div className="flex items-center justify-center min-h-screen">
          Error loading profile: {error.message}
        </div>
      </div>
    );
  }

  if (!user && initialDataLoaded) {
    return (
      <div
        className="fixed inset-0 text-white overflow-y-auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          width: '100vw',
          height: '100vh',
        }}
      >
        <div className="flex items-center justify-center min-h-screen">User not found.</div>
      </div>
    );
  }

  // If we have user data (either from cache or API), show the profile
  if (user) {
    // Check if current user is following this profile
    // const isFollowing = !!(currentLensAccount && user.followers.includes(currentUser.id));
    const isFollowing = false;

    return (
      <div
        className="fixed inset-0 text-white overflow-y-auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          width: '100vw',
          height: '100vh',
        }}
      >
        <div className="min-h-screen">
          {/* Cover Photo Section */}
          <div className="relative h-80 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                WebkitMask: 'linear-gradient(to bottom, #101010 0%, #101010 60%, transparent 100%)',
                mask: 'linear-gradient(to bottom, #101010 0%, #101010 60%, transparent 100%)',
              }}
            >
              {user.coverPhoto && user.coverPhoto !== '/images/cover.jpg' ? (
                <Image src={user.coverPhoto} alt="Cover" fill className="object-cover" />
              ) : (
                <Image src="/images/cover.jpg" alt="Cover" fill className="object-cover" />
              )}
            </div>
          </div>

          {/* Profile Section - with improved bottom padding */}
          <div className="px-4 pb-20">
            {/* Profile Picture & Stats */}
            <div className="relative -mt-24 mb-4">
              <div className="flex items-end justify-between">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-1">
                    <div className="w-full h-full bg-slate-900/80 backdrop-blur-sm rounded-full p-1">
                      <Image
                        src={user.profilePicture || defaultProfilePic}
                        alt="Profile"
                        width={120}
                        height={120}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Combined Stats Card */}
                <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center space-x-6">
                    <div
                      className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={handleFollowersClick}
                    >
                      <div className="text-2xl font-bold">{user.followers.length}</div>
                      <div className="text-sm text-white/60">Followers</div>
                    </div>
                    <div className="w-px h-8 bg-white/20"></div>
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <span className="text-2xl font-bold">
                          {nctLoading ? '...' : (nctBalance ?? 0).toFixed(1)}
                        </span>
                        <Image src={nocenix} alt="Nocenix" width={20} height={20} />
                      </div>
                      <div className="text-sm text-white/60">NCT Balance</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Username */}
            <h1 className="text-2xl font-bold mb-4">{user.username}</h1>

            {/* Bio - Read-only */}
            <div className="mb-6">
              <div className="flex-1">
                {(user.bio || 'This user has no bio.').split('\n').map((line, index) => (
                  <p key={index} className="text-white/80 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-6 flex space-x-3">
              <PrimaryButton
                text={
                  isPendingFollow
                    ? isFollowing
                      ? 'Unfollowing...'
                      : 'Following...'
                    : isFollowing
                      ? 'Following'
                      : 'Follow'
                }
                onClick={handleFollowToggle}
                className="flex-1"
                isActive={!isFollowing}
                disabled={isPendingFollow || !currentLensAccount}
              />
              {/* Only show Challenge button if viewing someone else's profile */}
              {currentLensAccount?.address !== user.id && (
                <PrimaryButton
                  text="Challenge"
                  onClick={handleChallengeClick}
                  className="flex-1"
                  isActive={false}
                  disabled={!currentLensAccount}
                />
              )}
            </div>

            {/* Three Section Menu using ThematicContainer */}
            <div className="mb-6 flex space-x-3 w-full">
              {[
                { key: 'trailer', label: 'Avatar' },
                { key: 'calendar', label: 'Calendar' },
                { key: 'achievements', label: 'Stats' },
              ].map(({ key, label }) => (
                <ThematicContainer
                  key={key}
                  asButton={true}
                  glassmorphic={false}
                  color={getButtonColor(key)}
                  isActive={activeSection === key}
                  onClick={() => setActiveSection(key as any)}
                  className="flex-1 min-w-0 px-2 py-1" // Added min-w-0 to prevent flex shrinking issues
                >
                  <span className="text-sm font-medium whitespace-nowrap text-center w-full">
                    {label}
                  </span>
                </ThematicContainer>
              ))}
            </div>

            {/* Content Based on Active Section - with bottom margin */}
            <div className="space-y-4 mb-8">
              {activeSection === 'trailer' && (
                <TrailerSection profilePicture="placeholder" generatedAvatar="placeholder" />
              )}

              {activeSection === 'calendar' && (
                <CalendarSection
                  dailyChallenges={user.dailyChallenge.split('').map((char) => char === '1')}
                  weeklyChallenges={user.weeklyChallenge.split('').map((char) => char === '1')}
                  monthlyChallenges={user.monthlyChallenge.split('').map((char) => char === '1')}
                />
              )}

              {activeSection === 'achievements' && (
                <StatsSection
                  currentStreak={currentStreak}
                  tokenBalance={nctBalance ? parseFloat(nctBalance.toFixed(1)) : 0}
                  dailyChallenges={user.dailyChallenge.split('').map((char) => char === '1')}
                  weeklyChallenges={user.weeklyChallenge.split('').map((char) => char === '1')}
                  monthlyChallenges={user.monthlyChallenge.split('').map((char) => char === '1')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Followers Popup */}
        <FollowersPopup
          isOpen={showFollowersPopup}
          onClose={() => setShowFollowersPopup(false)}
          followers={user.followers}
          isFollowers={true}
        />

        {/* Private Challenge Creator Modal */}
        {showPrivateChallengeCreator && lensData?.account && (
          <PrivateChallengeCreator
            onClose={() => setShowPrivateChallengeCreator(false)}
            onSubmit={async (challenge) => {
              // Handle challenge submission
              try {
                const response = await fetch('/api/private-challenge/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...challenge,
                    creatorId: currentLensAccount?.lensAccountId || currentLensAccount?.address,
                    creatorWalletAddress: activeAccount?.address,
                    creatorUsername: currentLensAccount?.username?.localName || 'Unknown',
                    creatorProfilePicture:
                      currentLensAccount?.metadata?.picture || '/images/profile.png',
                    recipientUsername: user.username || 'User',
                  }),
                });

                if (response.ok) {
                  alert('Challenge sent successfully!');
                  setShowPrivateChallengeCreator(false);
                } else {
                  const data = await response.json();
                  alert(`Failed: ${data.error || 'Unknown error'}`);
                }
              } catch (error) {
                console.error('Error sending challenge:', error);
                alert('Failed to send challenge');
              }
            }}
            prefilledUser={{
              id: lensData.account.address,
              username: lensData.account.username?.localName || user.username,
              profilePicture: lensData.account.metadata?.picture || user.profilePicture,
              wallet: lensData.account.address,
              earnedTokens: user.earnedTokens,
            }}
          />
        )}
      </div>
    );
  }

  // Default loading state (should only show briefly)
  return (
    <div
      className="fixed inset-0 text-white overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        width: '100vw',
        height: '100vh',
      }}
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default OtherProfileView;
