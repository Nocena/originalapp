import { Target, Trophy, Zap } from 'lucide-react';
import React from 'react';

interface ChallengeCompletionEmptyStateProps {
  isMine: boolean;
}

export const ChallengeCompletionEmptyState: React.FC<ChallengeCompletionEmptyStateProps> = ({
                                                                                              isMine,
                                                                                            }) => {
  return (
    <div className="text-center py-12">
      <div className="relative mb-6">
        {/* Main Trophy Icon */}
        <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Trophy className="w-10 h-10 text-gray-600" />
        </div>

        {/* Floating Icons */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <Target className="w-6 h-6 text-nocenaPink opacity-60 animate-bounce"
                  style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute top-4 right-1/2 transform translate-x-12">
          <Zap className="w-5 h-5 text-nocenaBlue opacity-60 animate-bounce" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">No Challenges Completed Yet</h3>
      {
        isMine && (
          <>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Start completing challenges to earn NCX tokens and showcase your achievements here!
            </p>

            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-nocenaPink rounded-full"></div>
                <span>Complete challenges to earn rewards</span>
              </div>
            </div>
          </>
        )
      }
    </div>
  );
};