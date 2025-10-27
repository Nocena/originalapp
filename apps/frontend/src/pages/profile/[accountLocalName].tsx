import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useActiveAccount } from 'thirdweb/react';
import { createPublicClient, defineChain, http } from 'viem';
import { useAuth } from '../../contexts/AuthContext';
import { useAccountQuery, useAccountStatsQuery } from '@nocena/indexer';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ThematicContainer from '../../components/ui/ThematicContainer';
import FollowersPopup from './components/FollowersPopup';
import TrailerSection from './components/AvatarSection';
import StatsSection from './components/StatsSection';
import CalendarSection from './components/CalendarSection';
import PrivateChallengeCreator from '../../components/PrivateChallengeCreator';
import getAvatar from '../../helpers/getAvatar';
import { useLensFollowActions } from '../../hooks/useLensFollowActions';
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
  const { accountLocalName } = router.query;
  const { currentLensAccount } = useAuth();
  const activeAccount = useActiveAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [showPrivateChallengeCreator, setShowPrivateChallengeCreator] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<'trailer' | 'calendar' | 'achievements'>(
    'trailer',
  );
  const [nctBalance, setNctBalance] = useState<number | null>(null);
  const [nctLoading, setNctLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch Lens account for the user
  const {
    data: lensData,
    loading: lensLoading,
    error: lensError,
  } = useAccountQuery({
    variables: { request: { username: { localName: (accountLocalName as string || '') } } },
    skip: !accountLocalName,
  });
  const selectedUserAccount = lensData?.account

  const { data: accountStatsData, loading: accountStatsLoading } = useAccountStatsQuery({
    variables: { request: { account: selectedUserAccount?.address } }
  });
  const stats = accountStatsData?.accountStats.graphFollowStats;

  const { followeringAccount, handleFollow, handleUnfollow } = useLensFollowActions();

  // Check if this page is visible in the PageManager
  useEffect(() => {
    if (!accountLocalName) return;

    const profilePath = `/profile/${accountLocalName}`;

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
  }, [accountLocalName]);

  useEffect(() => {
    if (scrollContainerRef.current && selectedUserAccount) {
      const currentMonthIndex = new Date().getMonth();
      const elementWidth = scrollContainerRef.current.scrollWidth / 12;
      scrollContainerRef.current.scrollLeft =
        elementWidth * currentMonthIndex -
        scrollContainerRef.current.clientWidth / 2 +
        elementWidth / 2;
    }
  }, [selectedUserAccount]);

  // Fetch NCT balance when owner address is available
  useEffect(() => {
    const fetchNctBalance = async () => {
      const ownerAddress = selectedUserAccount?.owner;
      if (!ownerAddress) return;

      setNctLoading(true);
      try {
        const publicClient = createPublicClient({
          chain: defineChain(FLOW_TESTNET_CONFIG),
          transport: http(),
        });

        const balance = (await publicClient.readContract({
          address: CONTRACTS.Nocenite as `0x${string}`,
          abi: noceniteTokenArtifact.abi,
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
  }, [selectedUserAccount?.owner]);

  const handleFollowToggle = async () => {
    if (!currentLensAccount || !selectedUserAccount) return;
    selectedUserAccount.operations?.isFollowedByMe
      ? handleUnfollow(selectedUserAccount)
      : handleFollow(selectedUserAccount)
  };

  // Handle "Challenge Me" button click
  const handleChallengeClick = () => {
    if (!selectedUserAccount) return;
    setShowPrivateChallengeCreator(true);
  };

  // Handle followers click
  const handleFollowersClick = () => {
    setShowFollowersPopup(true);
  };

  // Calculate stats for components
  const currentStreak = useMemo(() => {
    return 0;
/*
    if (!selectedUserAccount) return 0;
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
*/
  }, [selectedUserAccount]);

/*
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
  }, [selectedUserAccount]);
*/

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
  if (isLoading && !selectedUserAccount) {
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

  if (!selectedUserAccount && initialDataLoaded) {
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
  if (selectedUserAccount) {
    // Check if current user is following this profile
    // const isFollowing = !!(currentLensAccount && user.followers.includes(currentUser.id));
    const isFollowing = selectedUserAccount.operations?.isFollowedByMe || false;

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
              <Image src={selectedUserAccount?.metadata?.coverPicture || '/images/cover.jpg'} alt="Cover" fill className="object-cover" />
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
                        src={getAvatar(selectedUserAccount) || defaultProfilePic}
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
                      <div className="text-2xl font-bold">{stats?.followers}</div>
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
            <h1 className="text-2xl font-bold mb-4">{accountLocalName}</h1>

            {/* Bio - Read-only */}
            <div className="mb-6">
              <div className="flex-1">
                {(selectedUserAccount?.metadata?.bio || 'This user has no bio.').split('\n').map((line, index) => (
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
                isFollowing
                      ? 'Following'
                      : 'Follow'
                }
                onClick={handleFollowToggle}
                loading={!!followeringAccount}
                className="flex-1"
                isActive={!isFollowing}
                disabled={!selectedUserAccount}
              />
              {/* Only show Challenge button if viewing someone else's profile */}
              {currentLensAccount?.address !== selectedUserAccount?.address && (
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
                <TrailerSection profilePicture="placeholder" generatedAvatar={null} />
              )}

              {activeSection === 'calendar' && (
                <CalendarSection
                  dailyChallenges={''.split('').map((char) => char === '1')}
                  weeklyChallenges={''.split('').map((char) => char === '1')}
                  monthlyChallenges={''.split('').map((char) => char === '1')}
                />
              )}

              {activeSection === 'achievements' && (
                <StatsSection
                  currentStreak={currentStreak}
                  tokenBalance={0}
                  dailyChallenges={''.split('').map((char) => char === '1')}
                  weeklyChallenges={''.split('').map((char) => char === '1')}
                  monthlyChallenges={''.split('').map((char) => char === '1')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Followers Popup */}
        <FollowersPopup
          isOpen={showFollowersPopup}
          onClose={() => setShowFollowersPopup(false)}
          isFollowers={true}
          accountAddress={selectedUserAccount?.address}
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
                    creatorId: currentLensAccount?.address,
                    creatorWalletAddress: activeAccount?.address,
                    creatorUsername: currentLensAccount?.username?.localName || 'Unknown',
                    creatorProfilePicture:
                      currentLensAccount?.metadata?.picture || '/images/profile.png',
                    recipientUsername: accountLocalName || 'User',
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
              id: selectedUserAccount?.address,
              username: selectedUserAccount?.username?.localName || '',
              profilePicture: selectedUserAccount?.metadata?.picture,
              wallet: selectedUserAccount?.address,
              earnedTokens: 0,
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
