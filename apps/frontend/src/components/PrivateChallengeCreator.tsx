import React, { useState } from 'react';
import { CreatePrivateChallengeRequest } from '../types/notifications';
import SearchBox, { SearchUser } from '../pages/search/components/SearchBox';
import { useAuth } from '../contexts/AuthContext';

interface PrivateChallengeCreatorProps {
  onClose: () => void;
  onSubmit: (challenge: CreatePrivateChallengeRequest) => void;
}

const PrivateChallengeCreator: React.FC<PrivateChallengeCreatorProps> = ({ onClose, onSubmit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    recipientId: '',
    name: '',
    description: '',
    rewardAmount: 50,
  });
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [rewardError, setRewardError] = useState<string>('');

  const handleUserSelect = (selectedUser: SearchUser) => {
    // Prevent selecting yourself
    if (user?.id === selectedUser.id) {
      alert('You cannot send a challenge to yourself!');
      return;
    }
    
    setSelectedUser(selectedUser);
    setFormData({ ...formData, recipientId: selectedUser.id });
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
    if (formData.name && formData.description && formData.recipientId && !rewardError && formData.rewardAmount > 0) {
      onSubmit({
        ...formData,
        selectedUser,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
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
                  <img
                    src={selectedUser.profilePicture}
                    alt={selectedUser.username}
                    className="w-8 h-8 rounded-full"
                  />
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
              <SearchBox 
                onUserSelect={handleUserSelect} 
                currentUserId={user?.id}
                maxHeight="max-h-48"
              />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="block text-sm font-medium">Reward Amount (max 250)</label>
              {rewardError && (
                <span className="text-red-400 text-sm">{rewardError}</span>
              )}
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
