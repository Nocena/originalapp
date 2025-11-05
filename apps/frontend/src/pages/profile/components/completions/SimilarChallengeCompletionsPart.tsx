import React from 'react';
import { useUserSimilarChallengeCompletions } from '../../../../lib/graphql/features/challenge-completion/hook/useUserSimilarChallengeCompletions';
import { ChallengeCompletion } from '../../../../lib/graphql/features/challenge-completion/types';
import { SkeletonSlide } from './SkeletonSlide';
import { Trophy } from 'lucide-react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../contexts/AuthContext';
import { CompletedChallengesSwiper } from '@pages/profile/components/completions/CompletedChallengesSwiper';
import { SimilarCompletionEmptyState } from '@pages/profile/components/completions/SimilarCompletionEmptyState';

interface SimilarChallengeCompletionsPartProps {
  userID: string;
  challengeIds: string[];
}

const SimilarChallengeCompletionsPart: React.FC<SimilarChallengeCompletionsPartProps> = ({
  userID = 'current-user',
  challengeIds,
}) => {
  const { currentLensAccount } = useAuth();
  const router = useRouter();
  const { completions, loading } = useUserSimilarChallengeCompletions(userID, challengeIds);
  console.log("similar challenge completions", completions)
  const handleChallengeClick = (completion: ChallengeCompletion) => {
    router.push({
      pathname: '/browsing',
      query: {
        completionId: completion.id,
        userId: userID,
      },
    });
  };

  return (
    <div className="p-6">
      {/* Swiper Slider */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-nocena-blue bg-opacity-20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Similar Completed Challenges</h2>
            <p className="text-gray-400 text-sm">Challenges others successfully completed</p>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonSlide key={index} />
          ))}
        </div>
      ) : completions.length === 0 ? (
        <SimilarCompletionEmptyState />
      ) : (
        <CompletedChallengesSwiper
          completions={completions}
          onCompletionClick={handleChallengeClick}
        />
      )}
    </div>
  );
};

export default SimilarChallengeCompletionsPart;
