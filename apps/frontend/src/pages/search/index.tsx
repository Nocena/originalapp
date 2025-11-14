// @refresh reset
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useActiveAccount } from 'thirdweb/react';
import { useLensFollowActions } from '../../hooks/useLensFollowActions';

import ThematicImage from '../../components/ui/ThematicImage';
import ThematicContainer from '../../components/ui/ThematicContainer';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBox from './components/SearchBox';
import Image from 'next/image';
import { AccountFragment } from '@nocena/indexer';

interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  profilePicture: string;
  currentPeriodTokens: number;
  allTimeTokens: number;
  todayTokens: number;
  weekTokens: number;
  monthTokens: number;
  lastUpdate: string;
  isPlaceholder?: boolean; // For fake users when not enough real users
}

function SearchView() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [leaderboardType, setLeaderboardType] = useState<'tokens' | 'completions'>('tokens');
  const [timePeriod, setTimePeriod] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const { currentLensAccount } = useAuth();
  const activeAccount = useActiveAccount(); // Get actual connected wallet
  const router = useRouter();
  const { followeringAccount } = useLensFollowActions();

  // Fetch Top NCT Holders leaderboard
  const fetchLeaderboard = useCallback(async (): Promise<LeaderboardUser[]> => {
    try {
      // Storage diagnostics
      try {
        const storageEstimate = await navigator.storage?.estimate?.();
        console.log('📊 Storage usage:', {
          used: storageEstimate?.usage,
          quota: storageEstimate?.quota,
          percentage:
            storageEstimate?.usage && storageEstimate?.quota
              ? ((storageEstimate.usage / storageEstimate.quota) * 100).toFixed(1) + '%'
              : 'unknown',
        });

        console.log('🗄️ LocalStorage keys:', Object.keys(localStorage).length);
        console.log(
          '🔑 Large localStorage items:',
          Object.keys(localStorage)
            .map((key) => ({ key, size: localStorage.getItem(key)?.length || 0 }))
            .filter((item) => item.size > 10000)
            .sort((a, b) => b.size - a.size)
            .slice(0, 5)
        );
      } catch (diagError) {
        console.warn('Storage diagnostics failed:', diagError);
      }

      console.log('🔍 Fetching leaderboard...');

      // Build URL based on leaderboard type
      let url = `/api/leaderboard?limit=25`;

      if (leaderboardType === 'completions') {
        url += `&source=completions&period=${timePeriod}`;
      } else {
        url += `&source=blockchain`;
        if (activeAccount?.address) {
          url += `&userAddress=${activeAccount.address}`;
          if (currentLensAccount?.username?.localName) {
            url += `&username=${encodeURIComponent(currentLensAccount.username.localName)}`;
          }
          console.log('👤 Including connected wallet address:', activeAccount.address);
        } else if (currentLensAccount?.address) {
          url += `&userAddress=${currentLensAccount.address}`;
        }
        if (currentLensAccount?.username?.localName) {
          url += `&username=${encodeURIComponent(currentLensAccount.username.localName)}`;
        }
        console.log('👤 Including Lens account address:', currentLensAccount?.address);
      }

      const response = await fetch(url);

      if (!response.ok) {
        console.log('❌ Response not ok:', response.status);
        return [];
      }

      const data = await response.json();
      console.log('📊 API response:', data);

      if (!data.success) {
        console.log('❌ API returned success: false');
        return [];
      }

      console.log('✅ Returning leaderboard:', data.leaderboard);
      return data.leaderboard || [];
    } catch (error) {
      console.error('❌ Fetch error:', error);
      return [];
    }
  }, [
    leaderboardType,
    timePeriod,
    activeAccount?.address,
    currentLensAccount?.address,
    currentLensAccount?.username?.localName,
  ]);

  // Refresh leaderboard - simplified
  const refreshLeaderboard = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();

      if (!forceRefresh && now - lastRefreshTime < 10000) {
        return;
      }

      setIsLoading(true);
      setLastRefreshTime(now);

      try {
        const holders = await fetchLeaderboard();
        console.log('🏆 Leaderboard data received:', holders);
        console.log('🏆 Leaderboard length:', holders.length);
        setLeaderboard(holders);

        // Cache the data
        try {
          localStorage.setItem(
            'nocena_cached_leaderboard',
            JSON.stringify({
              data: holders,
              timestamp: now,
            })
          );
        } catch (error) {
          console.warn('Failed to cache leaderboard data:', error);
          // Clear storage if quota exceeded
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            try {
              localStorage.clear();
            } catch (clearError) {
              console.warn('Failed to clear localStorage:', clearError);
            }
          }
        }
      } catch (error) {
        // Silent fail for refresh
      } finally {
        setIsLoading(false);
      }
    },
    [fetchLeaderboard, lastRefreshTime]
  );

  // Simple page visibility handling - refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.pageName === 'search') {
        const wasVisible = isPageVisible;
        const nowVisible = customEvent.detail.isVisible;
        setIsPageVisible(nowVisible);

        // Always refresh when page becomes visible
        if (!wasVisible && nowVisible) {
          refreshLeaderboard(true); // Force refresh when opening page
        }
      }
    };

    window.addEventListener('pageVisibilityChange', handleVisibilityChange);
    setIsPageVisible(window.location.pathname === '/search');

    return () => {
      window.removeEventListener('pageVisibilityChange', handleVisibilityChange);
    };
  }, [isPageVisible]);

  // Load leaderboards - only once when page becomes visible
  useEffect(() => {
    if (!isPageVisible) return;

    refreshLeaderboard(true); // Force refresh on page load
  }, [isPageVisible]);

  // Refresh when leaderboard type or time period changes
  useEffect(() => {
    if (!isPageVisible) return;

    refreshLeaderboard(true);
  }, [leaderboardType, timePeriod, isPageVisible]);

  // Handle user selection from search - SearchBox will handle its own dropdown
  const handleUserSelect = useCallback(
    (account: AccountFragment) => {
      if (currentLensAccount?.address === account.address) {
        router.push('/profile');
      } else {
        router.push(`/profile/${account?.username?.localName}`);
      }
    },
    [router, currentLensAccount]
  );

  // Handle profile navigation
  const handleProfileNavigation = useCallback(
    (leaderboardUser: LeaderboardUser) => {
      if (currentLensAccount?.address === leaderboardUser.userId) {
        router.push('/profile');
      } else {
        router.push(`/profile/${leaderboardUser.userId}`);
      }
    },
    [router, currentLensAccount?.address]
  );

  // Render top 3 leaderboard items (podium style)
  const renderTopThreeItem = useCallback(
    (item: LeaderboardUser, index: number) => {
      // Check if this is the current user by comparing both userId and address
      const isCurrentUser =
        currentLensAccount?.address === item.userId || // Direct address match
        currentLensAccount?.username?.localName === item.userId || // Lens username match
        activeAccount?.address === item.userId; // Active account address match

      const isPending = followeringAccount?.address === item.userId;

      // Podium heights and styles
      const getPodiumStyle = (rank: number) => {
        if (rank === 1)
          return {
            height: 'h-36',
            color: 'nocenaBlue' as const,
            crown: '👑',
            textColor: 'text-yellow-400',
            order: 'order-2',
          };
        if (rank === 2)
          return {
            height: 'h-24',
            color: 'nocenaPurple' as const,
            crown: '🥈',
            textColor: 'text-gray-300',
            order: 'order-1',
          };
        if (rank === 3)
          return {
            height: 'h-16',
            color: 'nocenaPink' as const,
            crown: '🥉',
            textColor: 'text-orange-400',
            order: 'order-3',
          };
        return {
          height: 'h-16',
          color: 'nocenaBlue' as const,
          crown: '',
          textColor: 'text-gray-400',
          order: 'order-1',
        };
      };

      const style = getPodiumStyle(item.rank);

      return (
        <div
          key={item.userId}
          className={`flex flex-col items-center ${style.order} cursor-pointer`}
          onClick={() => handleProfileNavigation(item)}
        >
          {/* Profile Picture with Crown */}
          <div className="relative mb-2">
            <ThematicImage
              className={`rounded-full ${isCurrentUser ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30' : ''}`}
            >
              <Image
                src={item.profilePicture || '/images/profile.png'}
                alt="Profile"
                width={item.rank === 1 ? 80 : 64}
                height={item.rank === 1 ? 80 : 64}
                className={`${item.rank === 1 ? 'w-20 h-20' : 'w-16 h-16'} object-cover rounded-full`}
              />
            </ThematicImage>
            <div className="absolute -top-2 -right-2 text-2xl">{style.crown}</div>
            {isCurrentUser && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <ThematicContainer
                  asButton={false}
                  color="nocenaPink"
                  rounded="full"
                  className="px-2 py-0.5"
                >
                  <span className="text-xs font-medium">You</span>
                </ThematicContainer>
              </div>
            )}
          </div>

          {/* Username */}
          <h3
            className={`font-bold text-sm text-center mb-1 max-w-20 truncate ${isCurrentUser ? 'text-nocenaPink' : 'text-white'}`}
          >
            {item.username}
          </h3>

          {/* Token Count */}
          <div className="flex items-center justify-center mb-2">
            {leaderboardType === 'tokens' ? (
              <>
                <Image src="/nocenix.ico" alt="Nocenix" width={16} height={16} />
                <span className="text-xs font-semibold ml-1 text-white">
                  {item.currentPeriodTokens.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-xs font-semibold text-white">
                {item.currentPeriodTokens} challenges
              </span>
            )}
          </div>

          {/* Podium Base */}
          <ThematicContainer
            asButton={false}
            color={style.color}
            rounded="t-lg"
            className={`w-20 ${style.height} flex items-end justify-center pb-2`}
            isActive={isCurrentUser}
          >
            <span className={`text-2xl font-bold ${style.textColor}`}>{item.rank}</span>
          </ThematicContainer>
        </div>
      );
    },
    [currentLensAccount?.address, handleProfileNavigation]
  );

  // Render remaining items (clean list style)
  const renderRemainingItem = useCallback(
    (item: LeaderboardUser, index: number) => {
      const isCurrentUser = currentLensAccount?.address === item.userId;

      return (
        <ThematicContainer
          key={item.userId}
          asButton={false}
          glassmorphic={true}
          color={isCurrentUser ? 'nocenaPurple' : 'nocenaBlue'}
          rounded="xl"
          className={`p-4 mb-3 cursor-pointer hover:scale-[1.02] transition-transform ${
            isCurrentUser ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20' : ''
          }`}
          isActive={isCurrentUser}
          onClick={() => handleProfileNavigation(item)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800/50">
                <span className="text-sm font-bold text-gray-300">#{item.rank}</span>
              </div>

              {/* Profile Picture */}
              <ThematicImage className="rounded-full">
                <Image
                  src={item.profilePicture || '/images/profile.png'}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-cover rounded-full"
                />
              </ThematicImage>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3
                    className={`font-semibold ${isCurrentUser ? 'text-nocenaPink' : 'text-white'}`}
                  >
                    {item.username}
                  </h3>
                  {isCurrentUser && (
                    <ThematicContainer
                      asButton={false}
                      color="nocenaPink"
                      rounded="full"
                      className="px-2 py-0.5"
                    >
                      <span className="text-xs font-medium">You</span>
                    </ThematicContainer>
                  )}
                </div>

                {/* Token display */}
                <div className="flex items-center mt-1">
                  {leaderboardType === 'tokens' ? (
                    <>
                      <Image src="/nocenix.ico" alt="Nocenix" width={16} height={16} />
                      <span className="text-sm font-medium text-gray-300 ml-1">
                        {item.currentPeriodTokens.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-gray-300">
                      {item.currentPeriodTokens} challenges
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ThematicContainer>
      );
    },
    [currentLensAccount?.address, handleProfileNavigation]
  );

  return (
    <div className="text-white p-4 min-h-screen mt-20">
      <div className="flex flex-col items-center">
        {/* Search Box - will handle its own dropdown overlay */}
        <SearchBox onUserSelect={handleUserSelect} />

        {/* Title */}
        <div className="w-full max-w-md mt-6 mb-4">
          <p className="text-center text-sm text-gray-400 mt-1">
            {leaderboardType === 'tokens' ? 'Top NCT Holders' : 'Top Challenge Completers'}
          </p>
        </div>

        {/* Leaderboard Type Toggle */}
        <div className="w-full max-w-md mb-4">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setLeaderboardType('tokens')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                leaderboardType === 'tokens'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Token Balance
            </button>
            <button
              onClick={() => setLeaderboardType('completions')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                leaderboardType === 'completions'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Completions
            </button>
          </div>
        </div>

        {/* Time Period Toggle (only for completions) */}
        {leaderboardType === 'completions' && (
          <div className="w-full max-w-md mb-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTimePeriod('all')}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                  timePeriod === 'all'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setTimePeriod('monthly')}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                  timePeriod === 'monthly'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimePeriod('weekly')}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                  timePeriod === 'weekly'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="w-full max-w-md mb-28">
          {isLoading ? (
            <div className="w-full flex justify-center items-center py-8">
              <LoadingSpinner />
            </div>
          ) : leaderboard.length === 0 ? (
            <ThematicContainer
              asButton={false}
              glassmorphic={true}
              color="nocenaBlue"
              rounded="xl"
              className="p-8 text-center"
            >
              <div className="text-gray-400 mb-4">
                <h3 className="text-lg font-medium mb-2">No Rankings Yet</h3>
                <p className="text-sm">
                  Be the first to complete a challenge and claim the top spot!
                </p>
              </div>
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-xs text-gray-500">
                Complete challenges to appear on the leaderboard
              </p>
            </ThematicContainer>
          ) : (
            <div className="space-y-6">
              {/* Top 3 Podium */}
              {leaderboard.slice(0, 3).length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-center items-end gap-6 mb-6">
                    {leaderboard.slice(0, 3).map((item, index) => renderTopThreeItem(item, index))}
                  </div>
                </div>
              )}

              {/* Rest of the leaderboard */}
              {leaderboard.slice(3, 10).length > 0 && (
                <div>
                  {leaderboard
                    .slice(3, 10)
                    .map((item, index) => renderRemainingItem(item, index + 3))}
                </div>
              )}

              {/* Current user position - always show if not in top 10 */}
              {currentLensAccount &&
                (() => {
                  const userPosition = leaderboard.findIndex(
                    (item) =>
                      item.userId === currentLensAccount.address || // Direct address match
                      item.userId === currentLensAccount.username?.localName || // Lens username match
                      item.userId === activeAccount?.address // Active account address match
                  );
                  if (userPosition >= 10) {
                    const userItem = leaderboard[userPosition];
                    return (
                      <div className="mt-6 pt-4 border-t border-white/20">
                        <p className="text-center text-xs text-gray-400 mb-3">Your Position</p>
                        {renderRemainingItem(userItem, userPosition)}
                      </div>
                    );
                  }
                  return null;
                })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchView;
