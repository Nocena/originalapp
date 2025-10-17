import React, { useState } from 'react';
import { CreatePrivateChallengeRequest } from '../types/notifications';
import SearchBox, { SearchUser } from '../pages/search/components/SearchBox';

interface PrivateChallengeCreatorProps {
  onClose: () => void;
  onSubmit: (challenge: CreatePrivateChallengeRequest) => void;
}

const PrivateChallengeCreator: React.FC<PrivateChallengeCreatorProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    recipientId: '',
    name: '',
    description: '',
    rewardAmount: 50,
  });
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

  const handleUserSelect = (user: SearchUser) => {
    setSelectedUser(user);
    setFormData({ ...formData, recipientId: user.id });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.description && formData.recipientId) {
      onSubmit(formData);
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
              <SearchBox onUserSelect={handleUserSelect} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reward Amount (max 250)</label>
            <input
              type="number"
              value={formData.rewardAmount}
              onChange={(e) => setFormData({ ...formData, rewardAmount: Math.min(250, parseInt(e.target.value) || 0) })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              min="1"
              max="250"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUser}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
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
