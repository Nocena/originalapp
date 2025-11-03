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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.name &&
      formData.description &&
      formData.recipientId &&
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
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
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
      </div>
    </div>
  );
};

export default PrivateChallengeCreator;
