import React from 'react';
import { Star, Play } from 'lucide-react';
import { PlayButton } from './PlayButton';
import { HoverOverlay } from './HoverOverlay';
import { CreatorAvatar } from './CreatorAvatar';
import { BasicCompletionType } from '../../../../lib/graphql/features/challenge-completion/types';
import getAvatar from '../../../../helpers/getAvatar';

interface ChallengeSlideProps {
  challenge: BasicCompletionType;
  onClick: () => void;
}

export const ChallengeSlide: React.FC<ChallengeSlideProps> = ({ challenge, onClick }) => {
  return (
    <div className="group cursor-pointer bg-gray-800 rounded-lg overflow-hidden">
      {/* Challenge Image - Top Section */}
      <div className="relative aspect-video rounded-t-lg overflow-hidden">
        <img
          src={''}
          alt={''}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            <span className="text-white font-bold text-lg">{'reward'}</span>
            <span className="text-gray-400 text-sm">NCX</span>
          </div>

          <CreatorAvatar src={getAvatar(challenge.userAccount)} alt="Creator" />
        </div>

        {/* Challenge Title */}
        <h3 className="text-white text-sm font-medium mt-2 line-clamp-1">
          {''}
        </h3>
      </div>
    </div>
  );
};