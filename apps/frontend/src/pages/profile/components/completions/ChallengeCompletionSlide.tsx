import React from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { PlayButton } from './PlayButton';
import { HoverOverlay } from './HoverOverlay';
import { CreatorAvatar } from './CreatorAvatar';
import { ChallengeCompletion } from '../../../../lib/graphql/features/challenge-completion/types';
import getAvatar from '../../../../helpers/getAvatar';

interface ChallengeSlideProps {
  completion: ChallengeCompletion;
  onClick: () => void;
}

export const ChallengeCompletionSlide: React.FC<ChallengeSlideProps> = ({
  completion,
  onClick,
}) => {
  const challenge =
    completion.publicChallenge || completion.privateChallenge || completion.aiChallenge;

  console.log("challenge", completion, challenge)

  return (
    <div className="group cursor-pointer bg-gray-800 rounded-lg overflow-hidden">
      {/* Challenge Image - Top Section */}
      <div className="relative aspect-video rounded-t-lg overflow-hidden">
        <img
          src={completion.previewUrl || '/images/cover.jpg'}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/cover.jpg';
          }}
        />
        <PlayButton />
        <HoverOverlay onClick={onClick} />
      </div>

      {/* Info Section - Bottom Section */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          {/* Token Amount - Left */}
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-nocenaPink" />
            <span className="text-white font-bold text-lg">{challenge.reward}</span>
            <span className="text-gray-400 text-sm">NCX</span>
          </div>

          <CreatorAvatar src={getAvatar(completion.userAccount)} alt="Creator" />
        </div>

        {/* Challenge Title */}
        <h3 className="text-white text-sm font-medium mt-2 line-clamp-1">{challenge.title}</h3>

        {/* Challenge Description */}
        <p className="text-gray-400 text-xs mb-2 line-clamp-2 flex-1">{challenge.description}</p>

        {/* User Note (Optional) */}
        <div className="mt-auto">
          <div className="flex items-start space-x-2 bg-gray-700 rounded-lg p-2">
            <MessageSquare className="w-3 h-3 text-nocenaBlue mt-0.5 flex-shrink-0" />
            <p className="text-gray-300 text-xs italic line-clamp-2">"Completed the challenge!"</p>
          </div>
        </div>
      </div>
    </div>
  );
};
