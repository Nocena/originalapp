import React from 'react';
import { useUserChallengeCompletions } from '../../../../lib/graphql/features/challenge-completion/hook';
import { ChallengeCompletion } from '../../../../lib/graphql/features/challenge-completion/types';
import { SkeletonSlide } from './SkeletonSlide';
import { Trophy } from 'lucide-react';
import { useRouter } from 'next/router';
import { ChallengeCompletionEmptyState } from '@pages/profile/components/completions/ChallengeCompletionEmptyState';
import { useAuth } from '../../../../contexts/AuthContext';
import { CompletedChallengesSwiper } from '@pages/profile/components/completions/CompletedChallengesSwiper';

interface CompletedChallengePartProps {
  userID: string;
  completions: ChallengeCompletion[];
  loading: boolean;
}

const CompletedChallengePart: React.FC<CompletedChallengePartProps> = ({
                                                                         userID = 'current-user',
                                                                         completions,
                                                                         loading,
                                                                       }) => {
  const { currentLensAccount } = useAuth();
  const router = useRouter();

  const handleChallengeClick = (completion: ChallengeCompletion) => {
    router.push({
      pathname: '/browsing', query: {
        completionId: completion.id,
        userId: userID,
      },
    });
  };
  const isMine = userID === currentLensAccount?.address;

  return (
    <div className="p-6">
      {/* Swiper Slider */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-nocenaPink bg-opacity-20">
            <Trophy className="w-6 h-6 text-nocenaPink" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{isMine ? 'My Completed Challenges' : 'Completed Challenges'}</h2>
            <p className="text-gray-400 text-sm">{
              isMine ? `Challenges you've successfully completed` : `Challenges successfully completed`
            }</p>
          </div>
        </div>
      </div>
      {
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonSlide key={index} />
            ))}
          </div>
        ) : (
          completions.length === 0 ? (
            <ChallengeCompletionEmptyState isMine={isMine} />
          ) : (
            <CompletedChallengesSwiper
              completions={completions}
              onCompletionClick={handleChallengeClick}
            />
          )
        )
      }
    </div>
  );
};

export default CompletedChallengePart;
