import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { MapOptions } from 'maplibre-gl';
import { useAuth } from '../../contexts/AuthContext';
import UserLocationMarker from './components/UserLocationMarker';
import ChallengeMarker from './components/ChallengeMarker';
import MapControls from './components/MapControls';
import LoadingOverlay from './components/LoadingOverlay';
import { getMapStyleURL, getUserLocation, loadMapLibreCSS } from '../../lib/map/mapService';
import {
  generateRandomChallenges,
  generateSingleReplacement,
} from '../../lib/map/challengeGenerator';
import { fetchNearbyChallenge } from '../../lib/graphql';
import { fetchUserCompletionsByFilters } from '../../lib/graphql';
import { ChallengeData } from '../../lib/graphql/features/challenge/types';
import { LocationData } from '../../lib/types';
import toast from 'react-hot-toast';

// Helper function to get user's completed PUBLIC challenge IDs
async function getUserCompletedChallengeIds(userAddress?: string): Promise<string[]> {
  if (!userAddress) return [];

  try {
    const completions = await fetchUserCompletionsByFilters({
      userLensAccountId: userAddress,
      challengeType: 'public',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      endDate: new Date().toISOString(),
    });

    return completions.filter((c) => c.publicChallenge?.id).map((c) => c.publicChallenge!.id);
  } catch (error) {
    console.error('❌ Error fetching user completions:', error);
    return [];
  }
} // NEW: Import generator

interface BrowsingNavigationDetail {
  challengeId: string;
  userId: string;
}

interface BrowsingNavigationEvent extends CustomEvent {
  detail: BrowsingNavigationDetail;
}

const MapView = () => {
  const router = useRouter();
  const { currentLensAccount } = useAuth();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLibrary, setMapLibrary] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
  const [locatingUser, setLocatingUser] = useState(true);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false); // Disabled by default

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.zoomTo(currentZoom + 1, {
      duration: 300,
      essential: true,
    });
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom();
    mapInstanceRef.current.zoomTo(currentZoom - 1, {
      duration: 300,
      essential: true,
    });
  };

  // Handle AI challenge generation
  const handleGenerateChallenges = async () => {
    if (!userLocation || !currentLensAccount?.address) {
      throw new Error('User location and account required');
    }

    if (!buttonEnabled) {
      throw new Error('Weekly challenge generation is not available yet');
    }

    console.log('🎯 Generating weekly challenges at:', userLocation);
    console.log('🎯 User address:', currentLensAccount.address);

    try {
      // Generate challenges with user as creator
      const newChallenges = await generateRandomChallenges(
        userLocation.latitude,
        userLocation.longitude,
        10,
        currentLensAccount.address // Pass user address as creator
      );

      console.log(`✅ Generated ${newChallenges.length} weekly challenges`);
      console.log('🔍 Sample challenge:', newChallenges[0]);

      setChallenges(newChallenges);
      setButtonEnabled(false); // Disable button after use
      setSelectedPin(null);

      setTimeout(() => {
        toast.success(`Generated ${newChallenges.length} new weekly challenges! 🎉`);
      }, 100);
    } catch (error) {
      console.error('❌ Error generating weekly challenges:', error);
      throw error;
    }
  };

  useEffect(() => {
    const setMapHeight = () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.style.height = '100vh';
        mapContainerRef.current.style.width = '100vw';

        const parentContainer = mapContainerRef.current.parentElement;
        if (parentContainer) {
          parentContainer.style.position = 'fixed';
          parentContainer.style.top = '0';
          parentContainer.style.left = '0';
          parentContainer.style.right = '0';
          parentContainer.style.bottom = '0';
          parentContainer.style.zIndex = '1';
        }
      }
    };

    setMapHeight();
    window.addEventListener('resize', setMapHeight);

    return () => {
      window.removeEventListener('resize', setMapHeight);
    };
  }, []);

  useEffect(() => {
    const getUserLocationFirst = async () => {
      setLocatingUser(true);

      try {
        const location = await getUserLocation();
        setUserLocation(location);
        setInitialLocationSet(true);
      } catch (error: any) {
        console.warn('Error getting user location:', error);

        const defaultLocation = { longitude: 14.4378, latitude: 50.0755 };
        setUserLocation(defaultLocation);
        setInitialLocationSet(true);

        setLoadError('Unable to determine your precise location. Using default location instead.');
        setTimeout(() => setLoadError(null), 5000);
      }
    };

    getUserLocationFirst();
  }, []);

  useEffect(() => {
    if (!initialLocationSet || !userLocation) return;

    const initializeMap = async () => {
      try {
        loadMapLibreCSS();

        const MapLibre = await import('maplibre-gl');
        setMapLibrary(MapLibre);

        if (!mapContainerRef.current) return;

        const jawgAccessToken = process.env.NEXT_PUBLIC_JAWG_ACCESS_TOKEN;

        if (!jawgAccessToken) {
          console.warn('NEXT_PUBLIC_JAWG_ACCESS_TOKEN is not set in environment variables');
          setLoadError('Map access token not configured. Please contact support.');
          return;
        }

        const map = new MapLibre.Map({
          container: mapContainerRef.current,
          style: getMapStyleURL(jawgAccessToken),
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 15,
          attributionControl: false,
          zoomControl: false,
          renderWorldCopies: false,
          interactive: true,
          pitchWithRotate: false,
          antialias: true,
          fadeDuration: 0,
          preserveDrawingBuffer: true,
        } as MapOptions);

        map.addControl(
          new MapLibre.AttributionControl({
            compact: true,
          }),
          'bottom-left'
        );

        map.on('load', async () => {
          console.log('Map loaded successfully');
          mapInstanceRef.current = map;
          setMapLoaded(true);
          setLocatingUser(false);
        });

        map.on('error', (e) => {
          console.error('Map error:', e);
          setLoadError('Error loading map. Please try again later.');
          setLocatingUser(false);
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setLoadError('Failed to load map. Please check your connection and try again.');
        setLocatingUser(false);
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current && mapInstanceRef.current.remove) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLocationSet, userLocation]);

  const handleRecenterMap = async () => {
    if (!mapInstanceRef.current) return;

    setLocatingUser(true);

    try {
      const location = await getUserLocation();
      setUserLocation(location);

      mapInstanceRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 16,
        essential: true,
        animate: true,
        duration: 1000,
      });
    } catch (error) {
      console.warn('Error getting position for recentering:', error);
    } finally {
      setLocatingUser(false);
    }
  };

  // Check button state and load existing challenges on page load
  useEffect(() => {
    const initializeWeeklyChallenges = async () => {
      if (!currentLensAccount?.address) return;

      try {
        // Load existing user challenges first
        const challengesResponse = await fetch(
          `/api/map/user-challenges?userAddress=${currentLensAccount.address}`
        );
        const challengeData = await challengesResponse.json();

        if (challengeData.hasGenerated) {
          // User already generated challenges this week - load them and disable button
          console.log('📦 Loading existing weekly challenges');
          setChallenges(challengeData.challenges);
          setButtonEnabled(false);
        } else {
          // User hasn't generated yet - check if weekly event allows it
          const buttonResponse = await fetch('/api/map/button-state');
          const buttonState = await buttonResponse.json();

          if (buttonState.enabled) {
            console.log('🔘 Weekly event detected, enabling challenge button');
            setButtonEnabled(true);
          } else {
            console.log('⏳ No weekly event yet, button remains disabled');
            setButtonEnabled(false);
          }
        }
      } catch (error) {
        console.error('Error initializing weekly challenges:', error);
      }
    };

    initializeWeeklyChallenges();
  }, [currentLensAccount?.address]);

  // Initialize empty challenges - only generated via button
  useEffect(() => {
    if (!userLocation || !mapLoaded) return;

    // Ensure locatingUser is false when map is ready
    setLocatingUser(false);
  }, [userLocation, mapLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const handleMapMove = () => {
      if (selectedPin !== null) {
        setSelectedPin(null);
      }
    };

    const mapInstance = mapInstanceRef.current;
    mapInstance.on('movestart', handleMapMove);

    return () => {
      if (mapInstance && mapInstance.off) {
        mapInstance.off('movestart', handleMapMove);
      }
    };
  }, [selectedPin]);

  useEffect(() => {
    const handleChallengeCompleted = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { challengeId, userId } = customEvent.detail;

      console.log('🎉 Challenge completed, refreshing user challenges...', { challengeId, userId });

      if (userId === currentLensAccount?.address && userLocation) {
        // Refresh challenges for this user
        try {
          const userCompletedIds = await getUserCompletedChallengeIds(currentLensAccount?.address);
          const visibleChallenges = challenges.filter((c) => !userCompletedIds.includes(c.id));

          if (visibleChallenges.length < 10) {
            const needed = 10 - visibleChallenges.length;
            console.log(`🔄 Generating ${needed} replacement challenges...`);

            const replacements: ChallengeData[] = [];
            for (let i = 0; i < needed; i++) {
              const replacement = await generateSingleReplacement(
                userLocation.latitude,
                userLocation.longitude,
                [...visibleChallenges, ...replacements]
              );
              if (replacement) {
                replacements.push(replacement);
              }
            }

            setChallenges([...visibleChallenges, ...replacements]);
          } else {
            setChallenges(visibleChallenges);
          }
        } catch (error) {
          console.error('❌ Error refreshing challenges after completion:', error);
        }
      }
    };

    window.addEventListener('challengeCompleted', handleChallengeCompleted);

    return () => {
      window.removeEventListener('challengeCompleted', handleChallengeCompleted);
    };
  }, [challenges, currentLensAccount?.address, userLocation]);

  useEffect(() => {
    const handleBrowsingNavigation = async (event: Event) => {
      const customEvent = event as BrowsingNavigationEvent;
      const { challengeId, userId } = customEvent.detail;

      console.log('🎬 Navigating to browsing:', { challengeId, userId });

      try {
        await router.push({
          pathname: '/browsing',
          query: { challengeId, userId },
        });
        console.log('✅ Navigation to browsing successful');
      } catch (error) {
        console.error('❌ Navigation error:', error);
        router.push({ pathname: '/browsing', query: { challengeId, userId } });
        // window.location.href = `/browsing?challengeId=${challengeId}&userId=${userId}`;
      }
    };

    if (typeof window !== 'undefined') {
      (window as any).__NEXT_ROUTER__ = router;
    }

    window.addEventListener('navigateToBrowsing', handleBrowsingNavigation);

    return () => {
      window.removeEventListener('navigateToBrowsing', handleBrowsingNavigation);
      if (typeof window !== 'undefined') {
        delete (window as any).__NEXT_ROUTER__;
      }
    };
  }, [router]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (mapInstanceRef.current) {
        if (document.hidden) {
          // Pause map rendering when tab is hidden
          mapInstanceRef.current.getCanvas().style.visibility = 'hidden';
        } else {
          // Resume map rendering when tab is visible
          mapInstanceRef.current.getCanvas().style.visibility = 'visible';
          mapInstanceRef.current.resize(); // Ensure proper sizing
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-gray-900"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        width: '100vw',
        height: '100vh',
      }}
    >
      <div
        ref={mapContainerRef}
        className="w-full h-full bg-gray-900"
        style={{
          width: '100vw',
          height: '100vh',
        }}
      />

      {mapLoaded &&
        mapLibrary &&
        challenges.map((challenge, index) => (
          <ChallengeMarker
            key={challenge.id || `challenge-${index}`}
            map={mapInstanceRef.current}
            MapLibre={mapLibrary}
            challenge={challenge}
            index={index}
            isSelected={selectedPin === index}
            onSelect={setSelectedPin}
          />
        ))}

      {mapLoaded && mapLibrary && userLocation && (
        <UserLocationMarker
          map={mapInstanceRef.current}
          MapLibre={mapLibrary}
          location={[userLocation.longitude, userLocation.latitude]}
        />
      )}

      <MapControls
        mapLoaded={mapLoaded}
        locatingUser={locatingUser}
        onRecenter={handleRecenterMap}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onGenerateChallenges={handleGenerateChallenges}
        userLocation={userLocation}
        buttonEnabled={buttonEnabled}
      />

      {/* Challenge Generation Prompt */}
      {buttonEnabled && challenges.length === 0 && (
        <div className="absolute right-24 z-[200]" style={{ bottom: '168px' }}>
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Generate your 10 public challenges!</span>
            </div>
          </div>
          {/* Arrow pointing right towards AI generation button */}
          <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-purple-500"></div>
        </div>
      )}

      <LoadingOverlay mapLoaded={mapLoaded} locatingUser={locatingUser} loadError={loadError} />
    </div>
  );
};

export default MapView;
