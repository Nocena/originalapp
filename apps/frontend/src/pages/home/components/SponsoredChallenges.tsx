import React from 'react';
import ThematicContainer from '../../../components/ui/ThematicContainer';

interface SponsoredChallenge {
  id: string;
  companyName: string;
  challengeTitle: string;
  challengeDescription: string;
  reward: string;
  creatorLensAccountId?: string;
}

interface SponsoredChallengesProps {
  challenges: SponsoredChallenge[];
  onChallengeClick: (challenge: SponsoredChallenge) => void;
  currentUserAddress?: string;
}

const SponsoredChallenges: React.FC<SponsoredChallengesProps> = ({ 
  challenges, 
  onChallengeClick,
  currentUserAddress 
}) => {
  if (challenges.length === 0) {
    return (
      <div className="mb-8 flex flex-col items-center">
        <h2 className="text-xl font-bold text-white mb-4">Sponsored Challenges</h2>
        <p className="text-gray-400 text-sm">No sponsored challenges available</p>
      </div>
    );
  }

  return (
    <div className="mb-8 flex flex-col items-center">
      <h2 className="text-xl font-bold text-white mb-6">Sponsored Challenges</h2>
      <div className="w-full max-w-xl grid gap-4">
        {challenges.map((challenge) => (
          <ThematicContainer
            key={challenge.id}
            asButton={false}
            glassmorphic={true}
            color="nocenaBlue"
            rounded="xl"
            className="p-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full font-semibold">
                    SPONSORED
                  </span>
                  <span className="text-sm text-gray-400 ml-2">by {challenge.companyName}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {challenge.challengeTitle}
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  {challenge.challengeDescription}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-semibold">
                    Reward: {challenge.reward.replace('FLOW', 'NCT')}
                  </span>
                  {challenge.creatorLensAccountId !== currentUserAddress && (
                    <button 
                      onClick={() => onChallengeClick(challenge)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Start Challenge
                    </button>
                  )}
                </div>
              </div>
            </div>
          </ThematicContainer>
        ))}
      </div>
    </div>
  );
};

export default SponsoredChallenges;
