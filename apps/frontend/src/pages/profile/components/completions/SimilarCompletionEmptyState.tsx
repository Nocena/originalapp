import { Target, Trophy, Zap } from 'lucide-react';
import React from 'react';

export const SimilarCompletionEmptyState: React.FC = () => {
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

      <h3 className="text-xl font-bold text-white mb-2">Not Found Similar Completions</h3>
    </div>
  );
};