import React from 'react';
import { Star, Play } from 'lucide-react';
import { CompletedChallenge } from '../../types';
import { PlayButton } from './PlayButton';
import { HoverOverlay } from './HoverOverlay';
import { CreatorAvatar } from './CreatorAvatar';

interface ChallengeSlideProps {
  challenge: CompletedChallenge;
  onClick: () => void;
}

export const ChallengeSlide: React.FC<ChallengeSlideProps> = ({ challenge, onClick }) => {
  return (
    <div className="group cursor-pointer bg-gray-800 rounded-lg overflow-hidden">
      {/* Challenge Image - Top Section */}
      <div className="relative aspect-video rounded-t-lg overflow-hidden">
        <img
          src={challenge.thumbnailUrl}
          alt={challenge.title}
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
            <span className="text-white font-bold text-lg">{challenge.reward}</span>
            <span className="text-gray-400 text-sm">NCX</span>
          </div>

          <CreatorAvatar src={challenge.creatorAvatar} alt="Creator" />
        </div>

        {/* Challenge Title */}
        <h3 className="text-white text-sm font-medium mt-2 line-clamp-1">
          {challenge.title}
        </h3>
      </div>
    </div>
  );
};