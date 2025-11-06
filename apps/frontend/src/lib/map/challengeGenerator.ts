// src/lib/map/challengeGenerator.ts
import { ChallengeData } from './types';
import { createPublicChallenge } from '../graphql/features/public-challenge';

interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Generate AI challenge for specific POI type via API
async function generateAIChallenge(
  poiType: string,
  poiName: string,
  distance: number
): Promise<{ title: string; description: string; reward: number }> {
  try {
    console.log(`🤖 Calling API to generate challenge for ${poiType} at ${poiName}...`);

    const response = await fetch('/api/map/generate-challenges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        poiType,
        poiName,
        distance,
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️ API call failed with status ${response.status}`);
      return getFallbackChallenge(poiType);
    }

    const data = await response.json();

    if (data.fallback) {
      console.warn('⚠️ API returned fallback challenge');
    } else {
      console.log(`✅ AI generated: ${data.title}`);
    }

    return {
      title: data.title,
      description: data.description,
      reward: data.reward,
    };
  } catch (error) {
    console.error('❌ Error calling challenge generation API:', error);
    return getFallbackChallenge(poiType);
  }
}

// Fallback challenges if AI fails
function getFallbackChallenge(poiType: string): {
  title: string;
  description: string;
  reward: number;
} {
  const fallbacks: Record<string, { title: string; description: string; reward: number }> = {
    cafe: {
      title: 'OPERATION MENU MYSTERY',
      description: "Order something you've never tried. Film your honest reaction in 20 seconds",
      reward: 75,
    },
    park: {
      title: 'MISSION NATURE SCOUT',
      description: 'Find and film 3 different types of leaves in 30 seconds. Show your discoveries',
      reward: 70,
    },
    monument: {
      title: 'PROTOCOL TIME TRAVEL',
      description: 'Explain modern smartphones to this monument. Be dramatic and educational',
      reward: 90,
    },
    street: {
      title: 'OPERATION SIDEWALK STAR',
      description: 'Perform 15 seconds of interpretive dance at this location. Own the space',
      reward: 85,
    },
  };

  return (
    fallbacks[poiType] || {
      title: 'MISSION EXPLORER',
      description:
        'Document something interesting about this location in 30 seconds. Make it engaging',
      reward: 80,
    }
  );
}

// Expanded fun challenge templates - all completable in 30s video
const CHALLENGE_TEMPLATES = {
  cafe: [
    {
      title: '☕ Menu Roulette',
      desc: 'Close your eyes, point at the menu, and order whatever you land on! Show your reaction',
      reward: 80,
    },
    {
      title: '☕ Coffee Sommelier',
      desc: 'Smell 3 different coffee blends and describe them like a wine expert',
      reward: 75,
    },
    {
      title: '☕ Latte Art Critic',
      desc: 'Order any drink with foam and rate the art (or lack of it) dramatically',
      reward: 70,
    },
    {
      title: '☕ Speed Order',
      desc: "Order entirely in rhyme. Film the barista's reaction (with permission!)",
      reward: 90,
    },
  ],
  restaurant: [
    {
      title: '🍽️ Menu Mystery',
      desc: 'Ask the waiter for the weirdest thing they serve. Film your face when they tell you',
      reward: 85,
    },
  ],
  park: [
    {
      title: '🌳 Nature Documentary',
      desc: "Narrate 20 seconds of park life as if you're David Attenborough",
      reward: 85,
    },
    {
      title: '🌳 Leaf Collection Speedrun',
      desc: 'Find 5 different types of leaves in under 30 seconds',
      reward: 70,
    },
    {
      title: '🌳 Tree Hugger Challenge',
      desc: 'Hug a tree and explain what you learned from it (be poetic!)',
      reward: 80,
    },
    {
      title: '🌳 Park Bench Stories',
      desc: 'Sit on a bench and make up a dramatic backstory for it',
      reward: 75,
    },
    {
      title: '🌳 Wildlife Paparazzi',
      desc: 'Capture the best possible photo/video of any bird, squirrel, or pet',
      reward: 90,
    },
  ],
  artwork: [
    {
      title: '🎨 Art Interview',
      desc: 'Have a full conversation with this artwork (ask questions, wait for "answers")',
      reward: 95,
    },
    {
      title: '🎨 Living Statue',
      desc: 'Mimic the pose/style of this art for 20 seconds straight',
      reward: 100,
    },
    {
      title: '🎨 Museum Tour Guide',
      desc: 'Give a completely fake but hilarious tour guide explanation of this piece',
      reward: 110,
    },
    {
      title: '🎨 Behind The Art',
      desc: 'Narrate the "making of" this artwork as if you were there when it was created',
      reward: 90,
    },
  ],
  monument: [
    {
      title: '🗿 Time Traveler Explains',
      desc: 'Explain modern technology (smartphones, TikTok) to this ancient monument',
      reward: 100,
    },
    {
      title: '🗿 Breaking News Live',
      desc: 'Report breaking news from this historic location (make it absurdly dramatic)',
      reward: 95,
    },
    {
      title: '🗿 Monument Therapy',
      desc: 'Give this monument life advice about dealing with pigeons and tourists',
      reward: 90,
    },
    {
      title: '🗿 Historical Remix',
      desc: 'Tell the story of this place as if it was a superhero origin story',
      reward: 105,
    },
  ],
  fountain: [
    {
      title: '⛲ Fountain Wishes',
      desc: 'Make 3 wishes out loud and explain why each one would change your life',
      reward: 75,
    },
    {
      title: '⛲ Water Choreography',
      desc: "Choreograph a 15-second dance that matches the fountain's water movement",
      reward: 95,
    },
    {
      title: '⛲ Forced Perspective',
      desc: 'Create an optical illusion where you\'re "controlling" the fountain',
      reward: 85,
    },
    {
      title: '⛲ Fountain Commentary',
      desc: 'Commentate the fountain as if it\'s a sports event ("And the water goes UP!")',
      reward: 80,
    },
  ],
  viewpoint: [
    {
      title: '👁️ Dramatic Reveal',
      desc: 'Walk up to the viewpoint with your back turned, then spin around dramatically',
      reward: 120,
    },
    {
      title: '👁️ Forced Perspective Master',
      desc: "Create an illusion where you're holding the landmark in your hand",
      reward: 130,
    },
    {
      title: '👁️ Movie Trailer Voice',
      desc: "Narrate this view as if it's an epic movie trailer",
      reward: 100,
    },
    {
      title: '👁️ Panorama Challenge',
      desc: 'Do a slow 360° spin while maintaining perfect phone stability',
      reward: 90,
    },
  ],
  library: [
    {
      title: '📚 Dramatic Reading',
      desc: 'Random shelf, random book - read first 2 lines as dramatically as possible',
      reward: 85,
    },
    {
      title: '📚 Title Remix',
      desc: 'Find the most ridiculous book title combination on one shelf',
      reward: 80,
    },
    {
      title: '📚 Silent Film Star',
      desc: 'Act out a book title using only gestures (no sound!)',
      reward: 95,
    },
    {
      title: '📚 Speed Research',
      desc: 'Find a book with your birth year. Show it and read one interesting fact',
      reward: 90,
    },
  ],
  playground: [
    {
      title: '🎪 Childhood Unlocked',
      desc: "Use the slide/swing like you're 6 years old again. Capture the joy",
      reward: 85,
    },
    {
      title: '🎪 Playground Olympics',
      desc: 'Create your own sport using the equipment. Demonstrate it',
      reward: 100,
    },
    {
      title: '🎪 Swing Physics',
      desc: 'Swing as high as possible and capture the peak moment (safely!)',
      reward: 80,
    },
    {
      title: '🎪 Equipment Remix',
      desc: "Use playground equipment for something it wasn't designed for (safely!)",
      reward: 90,
    },
  ],
  bridge: [
    {
      title: '🌉 Slow Motion Hero',
      desc: 'Walk across in dramatic slow motion like an action movie',
      reward: 90,
    },
    {
      title: '🌉 Bridge Toll',
      desc: 'Create a silly ritual for crossing (spin 3 times, hop, etc)',
      reward: 85,
    },
    {
      title: '🌉 Perspective Master',
      desc: 'Capture the bridge from the most unusual angle possible',
      reward: 95,
    },
    {
      title: '🌉 Echo Test',
      desc: 'Test the acoustics - sing, clap, or shout and capture the echo',
      reward: 80,
    },
  ],
  market: [
    {
      title: '🛒 Mystery Purchase',
      desc: 'Buy the strangest item under $3. Show what you got and why',
      reward: 100,
    },
    {
      title: '🛒 Vendor Challenge',
      desc: 'Ask vendors "What\'s your secret menu item?" Film 3 responses',
      reward: 110,
    },
    {
      title: '🛒 Product Poetry',
      desc: 'Pick a random product and write a haiku about it on the spot',
      reward: 95,
    },
  ],
  statue: [
    {
      title: '🗿 Statue Conversation',
      desc: 'Have a full conversation with the statue. Ask about modern life',
      reward: 100,
    },
    {
      title: '🗿 Statue Swap',
      desc: 'Stand next to the statue and copy its pose for 20 seconds',
      reward: 85,
    },
    {
      title: '🗿 Statue Interview',
      desc: "Interview the statue as if it's a celebrity. Ask juicy questions",
      reward: 95,
    },
  ],
  bench: [
    {
      title: '🪑 Bench Theater',
      desc: 'Perform a 15-second dramatic monologue while sitting on this bench',
      reward: 80,
    },
    {
      title: '🪑 News Reporter',
      desc: 'Report live from this bench about "breaking bench news"',
      reward: 85,
    },
    {
      title: '🪑 Bench Detective',
      desc: 'Examine the bench and narrate what "mysterious events" happened here',
      reward: 75,
    },
  ],
  street: [
    {
      title: '🎭 Sidewalk Theater',
      desc: 'Perform a 10-second opera about your day at this spot',
      reward: 90,
    },
    {
      title: '🎭 Tour Guide Prank',
      desc: 'Pretend to be a tour guide explaining this "historic" street corner',
      reward: 95,
    },
    {
      title: '🎭 Dance Floor',
      desc: 'Turn this spot into a dance floor. 15 seconds of your best moves',
      reward: 85,
    },
    {
      title: '🎭 Time Freeze',
      desc: 'Stand completely still like a street performer for 20 seconds',
      reward: 80,
    },
  ],
  tram_stop: [
    {
      title: '🚊 Tram Stop Theater',
      desc: 'Dance while waiting for the tram (or pretend to wait)',
      reward: 85,
    },
    {
      title: '🚊 People Watching',
      desc: 'Narrate other people waiting like nature documentary (respectfully!)',
      reward: 80,
    },
    { title: '🚊 Fashion Show', desc: "Strut down the platform like it's a runway", reward: 90 },
  ],
  random: [
    {
      title: '🎲 Floor is Lava',
      desc: 'Navigate 10 meters without touching the ground. Use benches, walls, curbs',
      reward: 110,
    },
    {
      title: '🎲 Shadow Art',
      desc: 'Create shadow puppets or shadow art. Show your best creation',
      reward: 85,
    },
    {
      title: '🎲 Compliment Mission',
      desc: 'Give genuine compliments to 2 strangers (with respect!). Film reactions',
      reward: 120,
    },
    {
      title: '🎲 Speed Explorer',
      desc: "Find 3 things you've never noticed before in this area. Show them",
      reward: 80,
    },
    {
      title: '🎲 Life Narrator',
      desc: 'Narrate your own actions dramatically for 20 seconds',
      reward: 75,
    },
  ],
};

// Map Overpass tags to challenge categories
function categorizePOI(tags: Record<string, string>): string | null {
  if (tags.amenity === 'cafe') return 'cafe';
  if (tags.amenity === 'restaurant') return 'restaurant';
  if (tags.leisure === 'park' || tags.leisure === 'garden') return 'park';
  if (tags.tourism === 'artwork') return 'artwork';
  if (tags.historic === 'monument' || tags.historic === 'memorial') return 'monument';
  if (tags.amenity === 'fountain') return 'fountain';
  if (tags.tourism === 'viewpoint') return 'viewpoint';
  if (tags.amenity === 'library') return 'library';
  if (tags.leisure === 'playground') return 'playground';
  if (tags.man_made === 'bridge' || tags.bridge) return 'bridge';
  if (tags.amenity === 'marketplace' || tags.shop) return 'market';
  if (tags.historic === 'statue' || tags.artwork_type === 'statue') return 'statue';
  if (tags.amenity === 'bench') return 'bench';
  if (tags.highway === 'bus_stop' || tags.railway === 'tram_stop') return 'tram_stop';

  return 'street'; // Default to street challenge
}

// Generate Overpass query - simplified for faster response
function buildOverpassQuery(lat: number, lng: number, radius: number = 3000): string {
  return `
    [out:json][timeout:15];
    (
      node["amenity"~"cafe|fountain|library|bench"](around:${radius},${lat},${lng});
      node["amenity"="restaurant"](around:${radius},${lat},${lng});
      node["leisure"~"park|garden|playground"](around:${radius},${lat},${lng});
      node["tourism"~"artwork|viewpoint"](around:${radius},${lat},${lng});
      node["historic"~"monument|memorial|statue"](around:${radius},${lat},${lng});
      node["railway"="tram_stop"](around:${radius},${lat},${lng});
    );
    out body;
  `;
}

// Calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function generateRandomChallenges(
  userLat: number,
  userLng: number,
  count: number = 10,
  creatorAddress: string = 'system'
): Promise<ChallengeData[]> {
  try {
    // Get current week ID for metadata
    const now = new Date();
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
    monday.setUTCHours(0, 0, 0, 0);
    const weekId = monday.toISOString().split('T')[0];

    const query = buildOverpassQuery(userLat, userLng);

    console.log('🔍 Querying Overpass API...');

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.warn('⚠️ Overpass API failed, using fallback generation');
      return generateStaticFallbackChallenges(userLat, userLng, count);
    }

    const data: OverpassResponse = await response.json();

    console.log(`📊 Overpass returned ${data.elements?.length || 0} POIs`);

    if (!data.elements || data.elements.length === 0) {
      console.warn('⚠️ No POIs found, using fallback generation');
      return generateStaticFallbackChallenges(userLat, userLng, count);
    }

    const shuffledElements = data.elements.sort(() => Math.random() - 0.5);

    const challenges: ChallengeData[] = [];
    const usedPositions = new Set<string>();
    const categoryCount: Record<string, number> = {};
    const minDistance = 100;

    console.log(
      `🎯 Starting to process ${shuffledElements.length} POIs to generate ${count} challenges...`
    );

    // Process each POI with AI generation
    for (const element of shuffledElements) {
      if (challenges.length >= count) {
        console.log(`✅ Reached target of ${count} challenges, stopping`);
        break;
      }

      if (element.type !== 'node') continue;
      if (!element.lat || !element.lon) continue;

      const category = categorizePOI(element.tags);
      if (!category) continue;

      // Enforce category limits
      const currentCount = categoryCount[category] || 0;
      if (category === 'restaurant' && currentCount >= 1) continue;
      if (currentCount >= 2) continue;

      // Check minimum distance
      const posKey = `${element.lat.toFixed(4)},${element.lon.toFixed(4)}`;
      let tooClose = false;
      for (const existingPos of usedPositions) {
        const [existingLat, existingLng] = existingPos.split(',').map(Number);
        const distance = calculateDistance(element.lat, element.lon, existingLat, existingLng);
        if (distance < minDistance) {
          tooClose = true;
          break;
        }
      }

      if (tooClose) continue;

      // ✅ Save AI challenge to database as PUBLIC challenge
      const distance = calculateDistance(userLat, userLng, element.lat, element.lon);
      const poiName = element.tags.name || 'Mystery Location';

      console.log(`🤖 Generating AI challenge for ${category} at ${poiName}...`);

      const aiChallenge = await generateAIChallenge(category, poiName, distance);

      try {
        const challengeId = await createPublicChallenge(
          creatorAddress, // Use provided creator
          aiChallenge.title,
          `${aiChallenge.description}|week:${weekId}`, // Add week metadata
          aiChallenge.reward,
          element.lat,
          element.lon,
          1 // maxParticipants = 1 for user-specific challenges
        );

        const challenge: ChallengeData = {
          id: challengeId, // Use database ID
          title: aiChallenge.title,
          description: aiChallenge.description,
          position: [element.lon, element.lat],
          reward: aiChallenge.reward,
          color: ['#FD4EF5', '#10CAFF', '#ffffff'][Math.floor(Math.random() * 3)],
          creatorLensAccountId: 'system-generated',
          completionCount: 0,
          participantCount: 0,
          maxParticipants: 50,
          recentCompletions: [],
          category: category,
          distance: Math.round(distance),
          poiName: poiName,
        };

        challenges.push(challenge);
        usedPositions.add(posKey);
        categoryCount[category] = currentCount + 1;

        console.log(`✅ Saved challenge to database: ${challengeId}`);
      } catch (dbError) {
        console.error('❌ Failed to save challenge to database:', dbError);
        // Continue with fallback ID for testing
        const challenge: ChallengeData = {
          id: `fallback-${element.id}-${Date.now()}`,
          title: aiChallenge.title,
          description: aiChallenge.description,
          position: [element.lon, element.lat],
          reward: aiChallenge.reward,
          color: ['#FD4EF5', '#10CAFF', '#ffffff'][Math.floor(Math.random() * 3)],
          creatorLensAccountId: 'system-generated',
          completionCount: 0,
          participantCount: 0,
          maxParticipants: 50,
          recentCompletions: [],
          category: category,
          distance: Math.round(distance),
          poiName: poiName,
        };
        challenges.push(challenge);
        usedPositions.add(posKey);
        categoryCount[category] = currentCount + 1;
      }
    }

    // Sort by distance
    challenges.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Add random street challenges if needed
    while (challenges.length < Math.min(count, 10)) {
      const randomAngle = Math.random() * 2 * Math.PI;
      const randomDistance = 200 + Math.random() * 1000;
      const offsetLat = (randomDistance / 111320) * Math.cos(randomAngle);
      const offsetLng =
        (randomDistance / (111320 * Math.cos((userLat * Math.PI) / 180))) * Math.sin(randomAngle);

      // Use AI for random challenges too
      const aiChallenge = await generateAIChallenge('street', 'Adventure Spot', randomDistance);

      challenges.push({
        id: `fallback-${Date.now()}-${challenges.length}`,
        title: aiChallenge.title,
        description: aiChallenge.description,
        position: [userLng + offsetLng, userLat + offsetLat],
        reward: aiChallenge.reward,
        color: ['#FD4EF5', '#10CAFF', '#ffffff'][challenges.length % 3],
        creatorLensAccountId: 'system-generated',
        completionCount: 0,
        participantCount: 0,
        maxParticipants: 50,
        recentCompletions: [],
        category: 'random',
        distance: Math.round(randomDistance),
        poiName: 'Adventure Spot',
      });
    }

    return challenges.slice(0, count);
  } catch (error) {
    console.error('Error generating challenges:', error);
    console.log('🔄 Falling back to static challenge generation');
    return generateStaticFallbackChallenges(userLat, userLng, count);
  }
}

// Static fallback: Generate challenges without any API calls
function generateStaticFallbackChallenges(
  userLat: number,
  userLng: number,
  count: number = 10
): ChallengeData[] {
  const challenges: ChallengeData[] = [];

  const staticChallenges = [
    {
      title: 'OPERATION EXPLORER',
      description: 'Find something unusual at this spot. Document it in 30 seconds',
      reward: 75,
    },
    {
      title: 'MISSION VELOCITY',
      description: 'Sprint to this location from 50 meters away as fast as possible',
      reward: 80,
    },
    {
      title: 'PROTOCOL BALANCE',
      description: 'Balance on one foot for 30 seconds. Film your stability',
      reward: 70,
    },
    {
      title: 'TASK OBSERVATION',
      description: 'Count how many different colors you can spot in 30 seconds',
      reward: 65,
    },
    {
      title: 'OPERATION KINDNESS',
      description: 'Give a genuine compliment to someone nearby. Film their smile',
      reward: 90,
    },
    {
      title: 'MISSION STRENGTH',
      description: 'Do as many pushups as possible in 30 seconds. Show your power',
      reward: 85,
    },
    {
      title: 'CODE SHADOW',
      description: 'Create shadow art or shapes for 20 seconds. Be creative',
      reward: 75,
    },
    {
      title: 'PROTOCOL SPEED',
      description: 'Find and touch 5 different textures in 30 seconds',
      reward: 70,
    },
    {
      title: 'TASK PERFORMANCE',
      description: 'Perform a 15-second dramatic monologue at this location',
      reward: 80,
    },
    {
      title: 'MISSION DISCOVERY',
      description: 'Discover something about this area you never knew. Share it',
      reward: 75,
    },
  ];

  for (let i = 0; i < Math.min(count, staticChallenges.length); i++) {
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDistance = 100 + Math.random() * 1500;
    const offsetLat = (randomDistance / 111320) * Math.cos(randomAngle);
    const offsetLng =
      (randomDistance / (111320 * Math.cos((userLat * Math.PI) / 180))) * Math.sin(randomAngle);

    challenges.push({
      id: `static-fallback-${Date.now()}-${i}`,
      title: staticChallenges[i].title,
      description: staticChallenges[i].description,
      position: [userLng + offsetLng, userLat + offsetLat],
      reward: staticChallenges[i].reward,
      color: ['#FD4EF5', '#10CAFF', '#ffffff'][i % 3],
      creatorLensAccountId: 'system-generated',
      completionCount: 0,
      participantCount: 0,
      maxParticipants: 50,
      recentCompletions: [],
      category: 'random',
      distance: Math.round(randomDistance),
      poiName: 'Adventure Spot',
    });
  }

  return challenges;
}

// Generate a single replacement challenge avoiding existing locations
export async function generateSingleReplacement(
  userLat: number,
  userLng: number,
  existingChallenges: ChallengeData[]
): Promise<ChallengeData | null> {
  try {
    const query = buildOverpassQuery(userLat, userLng);

    console.log('🔍 Finding replacement challenge location...');

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.warn('⚠️ Overpass API failed for replacement');
      return null;
    }

    const data: OverpassResponse = await response.json();

    if (!data.elements || data.elements.length === 0) {
      console.warn('⚠️ No POIs found for replacement');
      return null;
    }

    // Get existing challenge positions to avoid
    const existingPositions = existingChallenges.map((c) => ({
      lat: c.position[1],
      lng: c.position[0],
    }));

    // Find a POI that's not too close to existing challenges
    const minDistance = 200; // 200m minimum distance
    const shuffledElements = data.elements.sort(() => Math.random() - 0.5);

    for (const element of shuffledElements) {
      if (element.type !== 'node' || !element.lat || !element.lon) continue;

      const category = categorizePOI(element.tags);
      if (!category) continue;

      // Check if this location is far enough from existing challenges
      const tooClose = existingPositions.some((pos) => {
        const distance = calculateDistance(element.lat, element.lon, pos.lat, pos.lng);
        return distance < minDistance;
      });

      if (tooClose) continue;

      // Generate AI challenge for this location
      const distance = calculateDistance(userLat, userLng, element.lat, element.lon);
      const poiName = element.tags.name || 'Mystery Location';

      console.log(`🤖 Generating replacement challenge for ${category} at ${poiName}...`);

      const aiChallenge = await generateAIChallenge(category, poiName, distance);

      try {
        const challengeId = await createPublicChallenge(
          'system',
          aiChallenge.title,
          aiChallenge.description,
          aiChallenge.reward,
          element.lat,
          element.lon,
          50
        );

        const challenge: ChallengeData = {
          id: challengeId,
          title: aiChallenge.title,
          description: aiChallenge.description,
          position: [element.lon, element.lat],
          reward: aiChallenge.reward,
          color: ['#FD4EF5', '#10CAFF', '#ffffff'][Math.floor(Math.random() * 3)],
          creatorLensAccountId: 'system-generated',
          completionCount: 0,
          participantCount: 0,
          maxParticipants: 50,
          recentCompletions: [],
          category: category,
          distance: Math.round(distance),
          poiName: poiName,
        };

        console.log(`✅ Generated replacement challenge: ${challenge.title}`);
        return challenge;
      } catch (dbError) {
        console.error('❌ Failed to save replacement challenge:', dbError);
        // Continue with fallback
        const challenge: ChallengeData = {
          id: `replacement-${element.id}-${Date.now()}`,
          title: aiChallenge.title,
          description: aiChallenge.description,
          position: [element.lon, element.lat],
          reward: aiChallenge.reward,
          color: ['#FD4EF5', '#10CAFF', '#ffffff'][Math.floor(Math.random() * 3)],
          creatorLensAccountId: 'system-generated',
          completionCount: 0,
          participantCount: 0,
          maxParticipants: 50,
          recentCompletions: [],
          category: category,
          distance: Math.round(distance),
          poiName: poiName,
        };

        return challenge;
      }
    }

    console.warn('⚠️ No suitable replacement location found');
    return null;
  } catch (error) {
    console.error('❌ Error generating replacement challenge:', error);
    return null;
  }
}
