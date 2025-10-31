'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.calculateDistance =
  exports.loadMapLibreCSS =
  exports.getUserLocation =
  exports.getMapStyleURL =
  exports.fetchNearbyChallenge =
    void 0;
const axios_1 = __importDefault(require('axios'));
// Function to fetch public challenges from Dgraph - UPDATED to include completions
const fetchNearbyChallenge = async (userLocation) => {
  try {
    // Query Dgraph directly - UPDATED to include completions
    const query = `
      query {
        queryPublicChallenge(filter: { isActive: true }) {
          id
          title
          description
          reward
          location {
            longitude
            latitude
          }
          creator {
            id
            username
            profilePicture
          }
          participantCount
          maxParticipants
          createdAt
          completions {
            id
            completionDate
            user {
              id
              username
              profilePicture
            }
          }
        }
      }
    `;
    const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';
    const response = await axios_1.default.post(
      DGRAPH_ENDPOINT,
      { query },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      return [];
    }
    const allChallenges = response.data.data?.queryPublicChallenge || [];
    // Filter challenges by distance (10km radius)
    const nearbyPublicChallenges = allChallenges.filter((challenge) => {
      const distance = (0, exports.calculateDistance)(
        userLocation.latitude,
        userLocation.longitude,
        challenge.location.latitude,
        challenge.location.longitude
      );
      return distance <= 1000; // 1000km radius
    });
    // Transform Dgraph challenge data to match our ChallengeData type
    return nearbyPublicChallenges.map((challenge, index) => ({
      id: challenge.id,
      position: [challenge.location.longitude, challenge.location.latitude],
      title: challenge.title,
      description: challenge.description,
      reward: challenge.reward,
      color: '#2353FF', // Default color for consistency
      // Additional data for UI
      creatorName: challenge.creator.username,
      creatorAvatar: challenge.creator.profilePicture,
      participantCount: challenge.participantCount,
      maxParticipants: challenge.maxParticipants,
      // NEW: Add completion data
      completionCount: challenge.completions?.length || 0,
      recentCompletions:
        challenge.completions
          ?.sort(
            (a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
          )
          ?.slice(0, 5) // Get most recent 5 completions
          ?.map((completion) => ({
            userId: completion.user.id,
            username: completion.user.username,
            profilePicture: completion.user.profilePicture,
            completedAt: completion.completionDate,
          })) || [],
    }));
  } catch (error) {
    console.error('Error fetching public challenges:', error);
    // Return empty array in case of error
    return [];
  }
};
exports.fetchNearbyChallenge = fetchNearbyChallenge;
// Helper for loading map styles
const getMapStyleURL = (accessToken) => {
  // Use your custom NOCENA style ID with the correct URL format
  const customStyleId = '43a6bd45-bb06-45ab-a7df-6e52d3fc98cb';
  return `https://api.jawg.io/styles/${customStyleId}.json?access-token=${accessToken}`;
};
exports.getMapStyleURL = getMapStyleURL;
// Get user location with reliable caching
const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    const handleError = (error) => {
      console.warn('Geolocation error:', error);
      // Use a default location in Prague
      // This is a fallback to always have a usable location
      const defaultLocation = {
        longitude: 14.4378,
        latitude: 50.0755, // Prague center
      };
      resolve(defaultLocation);
    };
    try {
      // Try to get cached location for immediate response
      const cachedData = localStorage.getItem('nocena_user_location');
      if (cachedData) {
        try {
          const { location, timestamp } = JSON.parse(cachedData);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('Using cached location');
            return resolve(location);
          }
        } catch (e) {
          console.warn('Error parsing cached location:', e);
        }
      }
    } catch (e) {
      console.warn('Error reading cached location:', e);
    }
    // No valid cache, get fresh location
    if (!navigator.geolocation) {
      return handleError(new Error('Geolocation is not supported by your browser'));
    }
    // Set up a timeout to handle slow geolocation requests
    const timeoutId = setTimeout(() => {
      handleError(new Error('Location request timed out'));
    }, 10000); // 10 second timeout
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const locationData = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        };
        // Cache the new location
        try {
          localStorage.setItem(
            'nocena_user_location',
            JSON.stringify({
              location: locationData,
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          console.warn('Error caching location:', e);
        }
        resolve(locationData);
      },
      (error) => {
        clearTimeout(timeoutId);
        handleError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000, // Accept positions up to 1 minute old
      }
    );
  });
};
exports.getUserLocation = getUserLocation;
// Load MapLibre CSS
const loadMapLibreCSS = () => {
  if (document.querySelector('link[href*="maplibre-gl.css"]')) {
    return; // Already loaded
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
  document.head.appendChild(link);
};
exports.loadMapLibreCSS = loadMapLibreCSS;
/**
 * Helper function to calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};
exports.calculateDistance = calculateDistance;
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};
