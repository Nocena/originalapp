// lib/utils/challengeUtils.ts
import axios from 'axios';
import { getDayOfYear, getWeekOfYear } from './dateUtils';

const DGRAPH_ENDPOINT = process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT || '';

export interface AIChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  frequency: string;
  isActive: boolean;
  createdAt?: string;
  day?: number;
  week?: number;
  month?: number;
  year?: number;
}

/**
 * Fetches the current AI challenge based on frequency (daily, weekly, monthly)
 */
// Helper function to get newest challenge from array
const getNewestChallenge = (challenges: AIChallenge[]): AIChallenge | null => {
  if (challenges.length === 0) return null;
  return challenges.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )[0];
};

export const getCurrentChallenge = async (
  frequency: 'daily' | 'weekly' | 'monthly'
): Promise<AIChallenge | null> => {
  const now = new Date();
  const year = now.getFullYear();

  // Since we can't filter by year/month/day/week directly in the filter,
  // we'll fetch all challenges of the given frequency and filter in JavaScript
  const query = `
    query GetAIChallenges {
      queryAIChallenge(filter: { 
        and: [
          { frequency: { eq: "${frequency}" } },
          { isActive: true }
        ]
      }) {
        id
        title
        description
        reward
        frequency
        isActive
        createdAt
        day
        week
        month
        year
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      { query },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      return null;
    }

    const challenges = response.data.data?.queryAIChallenge || [];

    // Now filter based on the current date
    let filteredChallenge = null;

    if (frequency === 'daily') {
      const dayOfYear = getDayOfYear(now);
      const dailyChallenges = challenges.filter((c: any) => c.year === year && c.day === dayOfYear);

      filteredChallenge =
        getNewestChallenge(dailyChallenges) ||
        getNewestChallenge(challenges.filter((c: any) => c.year === year));
    } else if (frequency === 'weekly') {
      const weekOfYear = getWeekOfYear(now);
      const weeklyChallenges = challenges.filter(
        (c: any) => c.year === year && c.week === weekOfYear
      );

      filteredChallenge =
        getNewestChallenge(weeklyChallenges) ||
        getNewestChallenge(
          challenges.filter((c: any) => c.year === year && c.week === weekOfYear + 1)
        ) ||
        getNewestChallenge(challenges.filter((c: any) => c.year === year));
    } else if (frequency === 'monthly') {
      const month = now.getMonth() + 1;
      const monthlyChallenges = challenges.filter((c: any) => c.year === year && c.month === month);

      filteredChallenge =
        getNewestChallenge(monthlyChallenges) ||
        getNewestChallenge(challenges.filter((c: any) => c.year === year));
    }

    if (filteredChallenge) {
      return filteredChallenge;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching ${frequency} challenge:`, error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    return null;
  }
};

/**
 * Get challenge reward based on the challenge data or use default
 */
import { CHALLENGE_REWARDS } from '../constants';

export const getChallengeReward = (challenge: AIChallenge | null, frequency: string): number => {
  // Always use constants for correct reward values: 100, 500, 2500
  // Ignore database reward values as they may be outdated
  switch (frequency) {
    case 'daily':
      return CHALLENGE_REWARDS.DAILY; // 100
    case 'weekly':
      return CHALLENGE_REWARDS.WEEKLY; // 500
    case 'monthly':
      return CHALLENGE_REWARDS.MONTHLY; // 2500
    default:
      return CHALLENGE_REWARDS.DAILY; // 100
  }
};

/**
 * Get a fallback challenge when none is found in the database
 */
export const getFallbackChallenge = (frequency: 'daily' | 'weekly' | 'monthly'): AIChallenge => {
  const fallbackChallenges = {
    daily: {
      id: 'fallback-daily',
      title: 'Daily Challenge',
      description: "Complete today's challenge to earn rewards!",
      reward: CHALLENGE_REWARDS.DAILY, // 100
      frequency: 'daily',
      isActive: false, // Mark as inactive to show offline state
    },
    weekly: {
      id: 'fallback-weekly',
      title: 'Weekly Challenge',
      description: "Complete this week's challenge for bonus rewards!",
      reward: CHALLENGE_REWARDS.WEEKLY, // 500
      frequency: 'weekly',
      isActive: false,
    },
    monthly: {
      id: 'fallback-monthly',
      title: 'Monthly Challenge',
      description: "Complete this month's epic challenge!",
      reward: CHALLENGE_REWARDS.MONTHLY, // 2500
      frequency: 'monthly',
      isActive: false,
    },
  };

  return fallbackChallenges[frequency];
};

/**
 * Fetch all active AI challenges (for admin/debug purposes)
 */
export const fetchAllAIChallenges = async (): Promise<AIChallenge[]> => {
  const query = `
    query GetAllAIChallenges {
      queryAIChallenge(filter: { isActive: true }) {
        id
        title
        description
        reward
        frequency
        isActive
        createdAt
        day
        week
        month
        year
      }
    }
  `;

  try {
    const response = await axios.post(
      DGRAPH_ENDPOINT,
      { query },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data.errors) {
      console.error('Dgraph query error:', response.data.errors);
      return [];
    }

    const challenges = response.data.data?.queryAIChallenge || [];
    return challenges;
  } catch (error) {
    console.error('Error fetching all AI challenges:', error);
    return [];
  }
};
