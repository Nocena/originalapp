import React, { useState } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';

interface SponsorFormData {
  sponsorName: string;
  description: string;
  challengeTitle: string;
  challengeDescription: string;
  challengeType: 'private' | 'public';
  location?: { lat: number; lng: number };
}

interface SponsorFormProps {
  onSubmit: (data: SponsorFormData) => void;
  onCancel: () => void;
}

const SponsorForm: React.FC<SponsorFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<SponsorFormData>({
    sponsorName: '',
    description: '',
    challengeTitle: '',
    challengeDescription: '',
    challengeType: 'private',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 pb-20"
      onClick={onCancel}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Create Sponsored Challenge</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sponsor Name</label>
            <input
              type="text"
              value={formData.sponsorName}
              onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              placeholder="Enter name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sponsor Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg h-24"
              placeholder="Enter description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Challenge Title</label>
            <input
              type="text"
              value={formData.challengeTitle}
              onChange={(e) => setFormData({ ...formData, challengeTitle: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              placeholder="Enter title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Challenge Description</label>
            <textarea
              value={formData.challengeDescription}
              onChange={(e) => setFormData({ ...formData, challengeDescription: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg h-24"
              placeholder="Describe the challenge"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Challenge Type</label>
            <select
              value={formData.challengeType}
              onChange={(e) => setFormData({ ...formData, challengeType: e.target.value as 'private' | 'public' })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg"
            >
              <option value="private">Brand Challenge (Homepage)</option>
              <option value="public">Location Challenge (Map)</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Challenge
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SponsorForm;
