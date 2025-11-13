import React, { useState, useEffect } from 'react';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import { toast } from 'react-hot-toast';

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
  loading?: boolean;
}

const SponsorForm: React.FC<SponsorFormProps> = ({ onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState<SponsorFormData>({
    sponsorName: '',
    description: '',
    challengeTitle: '',
    challengeDescription: '',
    challengeType: 'private',
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationObtained, setLocationObtained] = useState(false);

  // Get user location when public challenge type is selected
  useEffect(() => {
    if (formData.challengeType === 'public' && !formData.location) {
      getCurrentLocation();
    }
  }, [formData.challengeType]);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      setFormData((prev) => ({
        ...prev,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      }));

      setLocationObtained(true);
      toast.success('Location obtained successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Unable to get your location. Please enable location services.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate location for public challenges
    if (formData.challengeType === 'public' && !formData.location) {
      toast.error('Location is required for map challenges. Please enable location services.');
      return;
    }

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
              className="w-full px-3 py-2 bg-gray-700 rounded-lg h-16"
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
              className="w-full px-3 py-2 bg-gray-700 rounded-lg h-16"
              placeholder="Describe the challenge"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Challenge Type</label>
            <select
              value={formData.challengeType}
              onChange={(e) =>
                setFormData({ ...formData, challengeType: e.target.value as 'private' | 'public' })
              }
              className="w-full px-3 py-2 bg-gray-700 rounded-lg"
            >
              <option value="private">Sponsored Challenge (Homepage)</option>
              <option value="public">Location Challenge (Map)</option>
            </select>
          </div>

          {/* Location Status for Public Challenges */}
          {formData.challengeType === 'public' && (
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Location Status:</span>
                {locationLoading ? (
                  <span className="text-yellow-400 text-sm">Getting location...</span>
                ) : locationObtained ? (
                  <span className="text-green-400 text-sm">✓ Location obtained</span>
                ) : (
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="text-blue-400 text-sm hover:text-blue-300"
                  >
                    Get Location
                  </button>
                )}
              </div>
              {formData.location && (
                <div className="text-xs text-gray-400 mt-1">
                  Lat: {formData.location.lat.toFixed(6)}, Lng: {formData.location.lng.toFixed(6)}
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Challenge'
              )}
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
