// Challenge Types - organized from data/challenges.ts and lib/types.ts

export enum ChallengeFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum ChallengeCategory {
  AI = 'AI', // AI-generated challenges
  PUBLIC = 'public', // Business/sponsored challenges
  PRIVATE = 'private', // User-to-user challenges
}

export enum ChallengeCompletionMethod {
  IN_APP_RECORD = 'in_app_record', // In-app recording
  UPLOAD_VIDEO = 'upload_video', // External video upload
}

export interface Challenge {
  title: string;
  description: string;
  category?: ChallengeCategory;
  frequency?: ChallengeFrequency;
}

export interface ChallengeData {
  id?: string;
  position: [number, number];
  color: string;
  title: string;
  description: string;
  reward: number;
}

// Private Challenge Completion Types
export interface PrivateChallengeCompletion {
  challengeId: string;
  creatorId: string;
  recipientId: string;
  completedAt: string;
  rewardAmount: number;
  creatorReward: number; // 25 tokens for creator
  recipientReward: number; // 250 tokens for completer
}

// Helper function to get completion method and duration based on challenge type
export function getChallengeCompletionParams(
  category: ChallengeCategory,
  frequency?: ChallengeFrequency
): {
  completionMethod: ChallengeCompletionMethod;
  maxDurationSeconds: number;
} {
  // AI challenges have different formats based on frequency
  if (category === ChallengeCategory.AI && frequency) {
    switch (frequency) {
      case ChallengeFrequency.DAILY:
        return {
          completionMethod: ChallengeCompletionMethod.IN_APP_RECORD,
          maxDurationSeconds: 30,
        };
      case ChallengeFrequency.WEEKLY:
        return {
          completionMethod: ChallengeCompletionMethod.UPLOAD_VIDEO,
          maxDurationSeconds: 60,
        };
      case ChallengeFrequency.MONTHLY:
        return {
          completionMethod: ChallengeCompletionMethod.UPLOAD_VIDEO,
          maxDurationSeconds: 180,
        };
    }
  }

  // Public and private challenges use the same format as daily
  return {
    completionMethod: ChallengeCompletionMethod.IN_APP_RECORD,
    maxDurationSeconds: 30,
  };
}
