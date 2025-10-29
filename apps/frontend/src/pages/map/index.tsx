import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import type { MapOptions } from 'maplibre-gl';
import { useAuth } from '../../contexts/AuthContext';
import UserLocationMarker from './components/UserLocationMarker';
import ChallengeMarker from './components/ChallengeMarker';
import MapControls from './components/MapControls';
import LoadingOverlay from './components/LoadingOverlay';
import { getMapStyleURL, getUserLocation, loadMapLibreCSS } from '../../lib/map/mapService';
import { generateRandomChallenges, generateSingleReplacement } from '../../lib/map/challengeGenerator';
import { fetchNearbyChallenge } from '../../lib/graphql';
import { fetchUserCompletionsByFilters } from '../../lib/graphql';
import { ChallengeData } from '../../lib/graphql/features/challenge/types';
import { LocationData } from '../../lib/types';

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
    
    return completions
      .filter(c => c.publicChallenge?.id)
      .map(c => c.publicChallenge!.id);
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
    if (!userLocation) {
      throw new Error('User location is required');
    }

    console.log('🎯 Generating AI challenges at:', userLocation);

    try {
      const newChallenges = await generateRandomChallenges(
        userLocation.latitude,
        userLocation.longitude,
        10
      );

      console.log(`✅ Generated ${newChallenges.length} challenges`);

      setChallenges(newChallenges);

      // Cache challenges for persistence
      const cacheKey = `challenges_${Math.floor(userLocation.latitude * 100)}_${Math.floor(userLocation.longitude * 100)}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        challenges: newChallenges,
        timestamp: Date.now(),
        location: userLocation
      }));

      setSelectedPin(null);

      setTimeout(() => {
        alert(`Generated ${newChallenges.length} new AI challenges nearby! 🎉`);
      }, 100);
    } catch (error) {
      console.error('❌ Error generating challenges:', error);
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

          try {
            // Load cached challenges if available and fresh (< 1 hour)
            const cacheKey = `challenges_${Math.floor(userLocation.latitude * 100)}_${Math.floor(userLocation.longitude * 100)}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
              const { challenges: cachedChallenges, timestamp } = JSON.parse(cached);
              if (Date.now() - timestamp < 3600000) {
                console.log('📦 Using cached challenges');
                
                // Filter out user's completed challenges from cache
                try {
                  const userCompletedIds = await getUserCompletedChallengeIds(currentLensAccount?.address);
                  const visibleChallenges = cachedChallenges.filter((c: any) => !userCompletedIds.includes(c.id));
                  
                  console.log('🔍 Debug:', {
                    totalCached: cachedChallenges.length,
                    userCompletedIds,
                    visibleAfterFilter: visibleChallenges.length,
                    needToGenerate: 5 - visibleChallenges.length
                  });
                  
                  if (visibleChallenges.length < 10) {
                    const needed = 10 - visibleChallenges.length;
                    console.log(`🎯 User has ${visibleChallenges.length}/10 cached challenges, generating ${needed} replacements...`);
                    
                    const replacements: ChallengeData[] = [];
                    for (let i = 0; i < needed; i++) {
                      const replacement = await generateSingleReplacement(
                        userLocation.latitude,
                        userLocation.longitude,
                        [...visibleChallenges, ...replacements] // Avoid existing + already generated
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
                  console.error('❌ Error filtering cached challenges:', error);
                  setChallenges(cachedChallenges);
                }
                
                setLocatingUser(false);
                return;
              }
            }

            // Fallback to database challenges
            const nearbyChallenge = await fetchNearbyChallenge(userLocation);
            setChallenges(nearbyChallenge);
          } catch (error) {
            console.error('Error fetching challenges:', error);
          } finally {
            setLocatingUser(false);
          }
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

  // Auto-generate challenges when none exist
  useEffect(() => {
    const autoGenerateIfNeeded = async () => {
      if (!userLocation || !mapLoaded) return;

      try {
        // Get user's completed challenge IDs to filter them out
        const userCompletedIds = await getUserCompletedChallengeIds(currentLensAccount?.address);
        
        // Filter out completed challenges from current challenges
        const visibleChallenges = challenges.filter(c => !userCompletedIds.includes(c.id));
        
        if (visibleChallenges.length < 10) {
          const needed = 10 - visibleChallenges.length;
          console.log(`🎯 User has ${visibleChallenges.length}/10 challenges, generating ${needed} more...`);
          
          const newChallenges = await generateRandomChallenges(
            userLocation.latitude,
            userLocation.longitude,
            needed
          );
          
          // Combine visible existing + new challenges
          const allChallenges = [...visibleChallenges, ...newChallenges];
          setChallenges(allChallenges);
          
          // Update cache with all challenges (including completed ones for other users)
          const cacheKey = `challenges_${Math.floor(userLocation.latitude * 100)}_${Math.floor(userLocation.longitude * 100)}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            challenges: [...challenges, ...newChallenges], // Keep all challenges in cache
            timestamp: Date.now(),
            location: userLocation
          }));
        } else {
          // User has enough visible challenges, just update display
          setChallenges(visibleChallenges);
        }
      } catch (error) {
        console.error('❌ Auto-generation failed:', error);
      }
    };

    autoGenerateIfNeeded();
  }, [userLocation, mapLoaded, challenges.length, currentLensAccount?.address]);

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
          const visibleChallenges = challenges.filter(c => !userCompletedIds.includes(c.id));
          
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
        window.location.href = `/browsing?challengeId=${challengeId}&userId=${userId}`;
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
      />

      <LoadingOverlay mapLoaded={mapLoaded} locatingUser={locatingUser} loadError={loadError} />
    </div>
  );
};

export default MapView;
