import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { CreatePrivateChallengeRequest } from '../types/notifications';
import SearchBox, { SearchUser } from '../pages/search/components/SearchBox';
import { useAuth } from '../contexts/AuthContext';
import ThematicImage from './ui/ThematicImage';
import type { AccountFragment } from '@nocena/indexer';

interface PrivateChallengeCreatorProps {
  onClose: () => void;
  onSubmit: (challenge: CreatePrivateChallengeRequest) => void;
  prefilledUser?: SearchUser; // Optional pre-filled user
}

const PrivateChallengeCreator: React.FC<PrivateChallengeCreatorProps> = ({
  onClose,
  onSubmit,
  prefilledUser,
}) => {
  const { currentLensAccount } = useAuth();
  const [formData, setFormData] = useState({
    recipientId: prefilledUser?.id || '',
    recipientWalletAddress: prefilledUser?.wallet || '',
    name: '',
    description: '',
    rewardAmount: 50,
  });
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(prefilledUser || null);
  const [rewardError, setRewardError] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [creatingInvite, setCreatingInvite] = useState(false);

  // Update form data when prefilledUser changes
  useEffect(() => {
    if (prefilledUser) {
      setSelectedUser(prefilledUser);
      setFormData((prev) => ({
        ...prev,
        recipientId: prefilledUser.id,
        recipientWalletAddress: prefilledUser.wallet,
      }));
    }
  }, [prefilledUser]);

  const handleUserSelect = (account: AccountFragment) => {
    // Prevent selecting yourself
    if (currentLensAccount?.address === account.address) {
      toast.error('You cannot send a challenge to yourself!');
      return;
    }

    // Convert AccountFragment to SearchUser format for compatibility
    const searchUser: SearchUser = {
      id: account.address,
      username: account.username?.localName || account.address,
      profilePicture: account.metadata?.picture || '',
      wallet: account.address,
      earnedTokens: 0,
    };

    setSelectedUser(searchUser);
    setFormData({
      ...formData,
      recipientId: account.address,
      recipientWalletAddress: account.address,
    });
  };

  const handleRewardChange = (value: string) => {
    const numValue = parseInt(value) || 0;

    if (numValue > 250) {
      setRewardError('Exceeds private challenge limit');
    } else {
      setRewardError('');
    }

    setFormData({ ...formData, rewardAmount: numValue });
  };

  const handleCreateInviteLink = async () => {
    if (!formData.name || !formData.description || !!rewardError || formData.rewardAmount <= 0) {
      return;
    }

    setCreatingInvite(true);
    try {
      const response = await fetch('/api/private-challenge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: 'invite',
          name: formData.name,
          description: formData.description,
          rewardAmount: formData.rewardAmount,
          creatorId: currentLensAccount?.address,
          creatorUsername: currentLensAccount?.username?.localName || 'Unknown',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create challenge');
      }

      const data = await response.json();
      const challengeId = data.challengeId;
      
      const url = `${window.location.origin}/invite/${challengeId}?name=${encodeURIComponent(formData.name)}&reward=${formData.rewardAmount}`;
      setInviteUrl(url);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error creating invite link:', error);
      toast.error('Failed to create invite link');
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.name &&
      formData.description &&
      selectedUser && // Require selected user for direct challenges
      !rewardError &&
      formData.rewardAmount > 0
    ) {
      onSubmit({
        ...formData,
        selectedUser,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 pb-20"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Create Private Challenge</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Challenge Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              placeholder="Enter challenge name"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg h-24"
              placeholder="Describe the challenge"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Send To</label>
            {selectedUser ? (
              <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <ThematicImage className="rounded-full">
                    <Image
                      src={selectedUser.profilePicture || '/images/profile.png'}
                      alt={selectedUser.username}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-cover rounded-full"
                    />
                  </ThematicImage>
                  <span>@{selectedUser.username}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setFormData({ ...formData, recipientId: '' });
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ) : (
              <SearchBox onUserSelect={handleUserSelect} maxHeight="max-h-48" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="block text-sm font-medium">Reward Amount (max 250)</label>
              {rewardError && <span className="text-red-400 text-sm">{rewardError}</span>}
            </div>
            <input
              type="number"
              value={formData.rewardAmount || ''}
              onChange={(e) => handleRewardChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
              placeholder="Enter reward amount"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUser || !!rewardError || formData.rewardAmount <= 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Send Challenge
            </button>
          </div>
        </form>

        {/* Invite Link Option */}
        <div className="mt-4">
          <div className="relative flex items-center justify-center mb-3">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="px-3 text-gray-600 text-sm bg-gray-800">Or</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>
          <button
            type="button"
            onClick={handleCreateInviteLink}
            disabled={!formData.name || !formData.description || !!rewardError || formData.rewardAmount <= 0 || creatingInvite}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
          >
            {creatingInvite ? 'Creating Link...' : 'Create Invite Link 🔗'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Share on social media or copy link to clipboard
          </p>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4">
            <h4 className="text-lg font-semibold mb-4 text-center">Share Challenge</h4>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  const message = `You've been challenged! Complete "${formData.name}" and earn ${formData.rewardAmount} tokens → ${inviteUrl}`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="w-full px-4 py-3 bg-black hover:bg-gray-900 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Share on X</span>
              </button>

              <button
                onClick={() => {
                  const message = `You've been challenged! Complete "${formData.name}" and earn ${formData.rewardAmount} tokens`;
                  window.open(`https://t.me/share/url?url=${inviteUrl}&text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L7.942 13.98l-2.955-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.954z" />
                </svg>
                <span>Share on Telegram</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteUrl);
                  toast.success('Link copied to clipboard!');
                }}
                className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Copy Link</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateChallengeCreator;
