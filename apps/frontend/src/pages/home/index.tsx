// pages/home/index.tsx - WITH DISCOVER BUTTON
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  AIChallenge,
  getChallengeReward,
  getCurrentChallenge,
  getFallbackChallenge,
} from '@utils/challengeUtils';

// Component imports
import ChallengeHeader from './components/ChallengeHeader';
import ChallengeForm from './components/ChallengeForm';
import CompletionFeed from './components/CompletionFeed';
import CompletionItem from './components/CompletionItem';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PrimaryButton from '../../components/ui/PrimaryButton';
import PrivateChallengeCreator from '../../components/PrivateChallengeCreator';
import ThematicContainer from '../../components/ui/ThematicContainer';
import {
  fetchFollowingsCompletions,
  fetchLatestUserCompletion,
  isChallengeCompletedByUser,
} from 'src/lib/graphql/features/challenge-completion';
import { BasicCompletionType } from '../../lib/graphql/features/challenge-completion/types';
import { CreatePrivateChallengeRequest } from '../../types/notifications';

type ChallengeType = 'daily' | 'weekly' | 'monthly';

const HomeView = () => {
  const router = useRouter();
  const { currentLensAccount, loading } = useAuth();
  const [selectedTab, setSelectedTab] = useState<ChallengeType>('daily');
  const [followerCompletions, setFollowerCompletions] = useState<BasicCompletionType[]>([]);
  const [isFetchingCompletions, setIsFetchingCompletions] = useState(false);
  const [showPrivateChallengeCreator, setShowPrivateChallengeCreator] = useState(false);

  // Challenge state
  const [currentChallenge, setCurrentChallenge] = useState<AIChallenge | null>(null);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);

  // Latest completion state
  const [latestCompletion, setLatestCompletion] = useState<any>(null);
  const [isLoadingLatestCompletion, setIsLoadingLatestCompletion] = useState(false);

  // Fetch challenge from Dgraph when tab changes
  useEffect(() => {
    const loadChallenge = async () => {
      setIsLoadingChallenge(true);
      console.log(`🔄 Loading ${selectedTab} challenge from Dgraph...`);

      try {
        const challenge = await getCurrentChallenge(selectedTab);
        const isCompleted = await isChallengeCompletedByUser(
          currentLensAccount?.address,
          challenge?.id || ''
        );
        setHasCompleted(isCompleted);
        if (challenge) {
          console.log(`✅ Loaded ${selectedTab} challenge:`, challenge.title);
          setCurrentChallenge(challenge);
        } else {
          console.warn(`⚠️ No ${selectedTab} challenge found, using fallback`);
          setCurrentChallenge(getFallbackChallenge(selectedTab));
        }
      } catch (error) {
        console.error(`❌ Error loading ${selectedTab} challenge:`, error);
        setCurrentChallenge(getFallbackChallenge(selectedTab));
      } finally {
        setIsLoadingChallenge(false);
      }
    };

    loadChallenge();
  }, [currentLensAccount, selectedTab]);

  // Fetch latest completion when user changes or when completion status changes
  useEffect(() => {
    if (!currentLensAccount) return;

    const loadLatestCompletion = async () => {
      setIsLoadingLatestCompletion(true);
      try {
        console.log('🔄 Fetching latest completion...');
        const completion = await fetchLatestUserCompletion(currentLensAccount.address);
        setLatestCompletion(completion);
        console.log('✅ Latest completion:', completion);
      } catch (error) {
        console.error('❌ Error fetching latest completion:', error);
        setLatestCompletion(null);
      } finally {
        setIsLoadingLatestCompletion(false);
      }
    };

    loadLatestCompletion();
  }, [currentLensAccount]);

  // Calculate reward based on challenge data or fallback
  const reward = useMemo(() => {
    return getChallengeReward(currentChallenge, selectedTab);
  }, [currentChallenge, selectedTab]);

  // Check if latest completion matches current challenge frequency
  const latestCompletionMatchesTab = useMemo(() => {
    if (!latestCompletion || !latestCompletion.aiChallenge) return false;
    return latestCompletion.aiChallenge.frequency === selectedTab;
  }, [latestCompletion, selectedTab]);

  // ONLY fetch follower completions if user has actually completed the challenge
  useEffect(() => {
    if (!currentLensAccount || loading || !hasCompleted) {
      setFollowerCompletions([]);
      setIsFetchingCompletions(false);
      return;
    }

    const loadFollowerCompletions = async () => {
      setIsFetchingCompletions(true);

      try {
        console.log(`User has completed ${selectedTab} challenge, fetching friend completions...`);
        const today = new Date().toISOString().split('T')[0];
        const completions = await fetchFollowingsCompletions(
          currentLensAccount.address,
          today,
          selectedTab
        );
        setFollowerCompletions(completions);
        console.log('Loaded follower completions:', completions.length);
      } catch (error) {
        console.error('Error fetching follower completions:', error);
        setFollowerCompletions([]);
      } finally {
        setIsFetchingCompletions(false);
      }
    };

    loadFollowerCompletions();
  }, [currentLensAccount, loading, selectedTab, hasCompleted]);

  // Handle private challenge creation
  const handlePrivateChallengeSubmit = async (challenge: CreatePrivateChallengeRequest) => {
    try {
      const response = await fetch('/api/private-challenge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...challenge,
          creatorId: currentLensAccount?.address,
          creatorUsername: currentLensAccount?.username?.localName || 'Anonymous',
        }),
      });

      if (response.ok) {
        toast.success('Private challenge sent successfully!');
        // Delay closing modal to ensure toast is visible
        setTimeout(() => {
          setShowPrivateChallengeCreator(false);
        }, 5000);
      } else {
        const data = await response.json();
        toast.error(`Failed to send private challenge: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending private challenge:', error);
      toast.error('Error sending private challenge');
    }
  };

  const handleCompleteChallenge = async (type: string, frequency: string) => {
    if (!currentLensAccount) {
      alert('Please login to complete challenges!');
      router.push('/login');
      return;
    }

    if (!currentChallenge) {
      alert('No challenge available. Please try again later.');
      return;
    }

    // Don't allow completing offline/fallback challenges
    if (!currentChallenge.isActive) {
      alert('Challenge is currently unavailable. Please check your connection and try again.');
      return;
    }

    // Prevent double completion
    if (hasCompleted) {
      alert(`You have already completed today's ${selectedTab} challenge!`);
      return;
    }

    try {
      router.push({
        pathname: '/completing',
        query: {
          challengeId: currentChallenge.id,
          type, // 'AI'
          frequency, // 'daily', 'weekly', or 'monthly'
          title: currentChallenge.title,
          description: currentChallenge.description,
          reward: currentChallenge.reward,
          visibility: 'public',
        },
      });
    } catch (error) {
      console.error('Error navigating to challenge completion:', error);
      alert('Failed to start challenge. Please try again.');
    }
  };

  // Handle discover button click - navigate to browsing with all completions
  const handleDiscoverClick = () => {
    /*
        (async () => {
          try {
            const userId = "0x10110A0Cf8f97D3802953078A2C2629f1146ACBb"
            const timestamp = Date.now();
            const challengeId = 'cb0e6c5b-897e-4594-a4b2-d4270f14c09c'
            const videoUrl = 'https://jade-elaborate-emu-349.mypinata.cloud/ipfs/bafybeig7ac2xdbzduruuoin2mqdvhztn3rawzwuwoxd6waxa7hdoym5hhe?pinataGatewayToken=XQTlgcFp9rPCXpkx3GkP5M28RfBWRUUwaUwF2H_SCyA3TiFZvm-ssBVMLgIRVz9G';
            const photoUrl = 'https://jade-elaborate-emu-349.mypinata.cloud/ipfs/bafkreidrcrxhgfd4pz4uvlcogo3vw44mfhhcdyzdr5skhdmimg3bkck5ri?pinataGatewayToken=XQTlgcFp9rPCXpkx3GkP5M28RfBWRUUwaUwF2H_SCyA3TiFZvm-ssBVMLgIRVz9G';

            const video = await fetchBlobFromUrl(videoUrl);
            const photo = await fetchBlobFromUrl(photoUrl);
            const videoCID = await uploadBlob(video, 'video');
            const selfieCID = await uploadBlob(photo, 'photo');
            const snapshotBlob = await getVideoSnapshot(video, 0); // first frame
            const previewCID = await uploadBlob(snapshotBlob, 'photo');

            console.log("creating......")
            await createChallengeCompletion(
              userId,
              'ai',
              JSON.stringify({
                videoCID,
                selfieCID,
                previewCID,
                timestamp,
                description: "Tell us about completing this challenge...",
                verificationResult: {
                  backgroundOptimized: true,
                  timestamp: new Date().toISOString(),
                },
                hasVideo: true,
                hasSelfie: true,
                hasPreview: true,
                videoFileName: `challenge_video_${userId}_${timestamp}.webm`,
                selfieFileName: `challenge_selfie_${userId}_${timestamp}.jpg`,
              }),
              challengeId,
            );
            console.log("finished......")
          } catch (error) {
            console.error('❌ Error in daily challenge process:', error);
            process.exit(1);
          }
        })()
    */
    if (!currentLensAccount) {
      alert('Please login to discover challenges!');
      router.push('/login');
      return;
    }

    // Navigate to browsing page without specific challenge/user filters
    // This will show all completions across the app
    router.push('/browsing');
  };

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="text-white p-4 min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="text-white p-4 min-h-screen mt-20">
      <div className="max-w-4xl mx-auto">
        {/* Private Challenge Creator Modal */}
        {showPrivateChallengeCreator && (
          <PrivateChallengeCreator
            onClose={() => setShowPrivateChallengeCreator(false)}
            onSubmit={handlePrivateChallengeSubmit}
          />
        )}

        {/* Private Challenge Creator Button */}
        {currentLensAccount && (
          <div className="mb-6">
            <ThematicContainer
              asButton={false}
              glassmorphic={true}
              color="nocenaPurple"
              rounded="xl"
              className="p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Challenge a Friend</h3>
                  <p className="text-gray-300 text-sm">
                    Send custom challenges to your friends and compete for rewards!
                  </p>
                </div>
                <button
                  onClick={() => setShowPrivateChallengeCreator(true)}
                  className="bg-nocenaPink hover:bg-nocenaPink/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Create Challenge
                </button>
              </div>
            </ThematicContainer>
          </div>
        )}

        {/* Challenge Type Tabs */}
        <ChallengeHeader selectedTab={selectedTab} onTabChange={setSelectedTab} />

        {/* Show loading state while fetching challenge */}
        {isLoadingChallenge ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-300">Loading {selectedTab} challenge...</span>
          </div>
        ) : (
          /* Main Content */
          <>
            {/* Discover Button */}
            <div className="mt-6 flex justify-center mb-8">
              <PrimaryButton onClick={handleDiscoverClick} isActive={true} text="Discover" />
            </div>
            {/* Always show the challenge form - it will display completion state if completed */}
            <ChallengeForm
              challenge={currentChallenge}
              reward={reward}
              selectedTab={selectedTab}
              hasCompleted={hasCompleted}
              onCompleteChallenge={handleCompleteChallenge}
            />

            {/* Show latest completion using CompletionItem if user has completed and it matches current tab */}
            {hasCompleted &&
              latestCompletionMatchesTab &&
              latestCompletion &&
              currentLensAccount && (
                <div className="mt-8">
                  <CompletionItem
                    account={currentLensAccount}
                    completion={latestCompletion}
                    isSelf={true}
                  />
                </div>
              )}

            {/* Show completion feed if user has completed the challenge */}
            {hasCompleted && (
              <div className="mt-8">
                <CompletionFeed
                  isLoading={isFetchingCompletions}
                  followerCompletions={followerCompletions}
                  selectedTab={selectedTab}
                  hasCompleted={hasCompleted}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomeView;
