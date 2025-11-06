import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import ThematicContainer from '../../components/ui/ThematicContainer';
import Image from 'next/image';

interface ChallengeData {
  id: string;
  title: string;
  description: string;
  reward: number;
  creatorLensAccountId: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export default function InvitePage() {
  const router = useRouter();
  const { challengeId } = router.query;
  const { currentLensAccount } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);

  useEffect(() => {
    if (challengeId && typeof challengeId === 'string') {
      fetchChallenge(challengeId);
    }
  }, [challengeId]);

  const fetchChallenge = async (id: string) => {
    try {
      const response = await fetch(`/api/private-challenge/get?challengeId=${id}`);
      if (!response.ok) {
        throw new Error('Challenge not found');
      }
      const data = await response.json();
      setChallenge(data.challenge);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthRedirect = (authType: 'login' | 'register') => {
    if (challenge && typeof window !== 'undefined') {
      sessionStorage.setItem('pendingChallengeId', challengeId as string);
      sessionStorage.setItem('pendingChallengeData', JSON.stringify({
        title: challenge.title,
        description: challenge.description,
        reward: challenge.reward,
        creatorLensAccountId: challenge.creatorLensAccountId
      }));
    }
    router.push(`/${authType}`);
  };

  const handleAcceptChallenge = async () => {
    if (challenge && currentLensAccount) {
      try {
        // First accept the challenge in the database
        const response = await fetch('/api/private-challenge/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeId: challenge.id,
            recipientId: currentLensAccount.address,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to accept challenge');
        }

        // Then redirect to completion page
        router.push(`/completing?type=PRIVATE&challengeId=${challengeId}&title=${encodeURIComponent(challenge.title)}&description=${encodeURIComponent(challenge.description)}&reward=${challenge.reward}&creatorWalletAddress=${challenge.creatorLensAccountId}`);
      } catch (error) {
        console.error('Error accepting challenge:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-nocenaBg to-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-700/50">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo/LogoDark.png"
              alt="Nocena"
              width={24}
              height={24}
              className="mr-2"
            />
            <h3 className="text-xl font-semibold text-white">Challenge Invitation</h3>
          </div>
          <p className="text-gray-400">You've been invited to complete a challenge!</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/20">
            <h2 className="text-xl font-bold text-white mb-2 text-center">Challenge: "{challenge.title}"</h2>
            <p className="text-gray-300 text-center leading-relaxed">{challenge.description}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/30">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Reward:</span>
              <div className="flex items-center">
                <Image
                  src="/nocenix.ico"
                  alt="NCT"
                  width={16}
                  height={16}
                  className="mr-1"
                />
                <span className="text-green-400 font-semibold">{challenge.reward} NCT</span>
              </div>
            </div>
          </div>
        </div>

        {!currentLensAccount ? (
          <div className="space-y-3">
            <button
              onClick={() => handleAuthRedirect('login')}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-colors text-white font-medium"
            >
              Sign In & Complete
            </button>
            <button
              onClick={() => handleAuthRedirect('register')}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-colors text-white font-medium"
            >
              Sign Up & Complete
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button 
              onClick={handleAcceptChallenge}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-colors text-white font-medium"
            >
              Accept Challenge
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
            >
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
