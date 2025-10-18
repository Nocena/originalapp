// Notification Types - extracted from inbox component for better organization

export interface NotificationBase {
  id: string;
  content?: string;
  createdAt: string;
  notificationType: string;
  triggeredBy?: {
    id?: string;
    username?: string;
    profilePicture?: string;
  };
  reward?: number;
  isRead?: boolean;
  // Challenge reference properties
  privateChallenge?: {
    id: string;
    title: string;
    description: string;
  };
  publicChallenge?: {
    id: string;
    title: string;
    description: string;
  };
  aiChallenge?: {
    id: string;
    title: string;
    description: string;
    frequency: string;
  };
}

// Private Challenge System Types
export interface PrivateChallengeInvite {
  id: string;
  creatorId: string;
  creatorUsername: string;
  creatorProfilePicture: string;
  recipientId: string;
  recipientUsername: string;
  name: string;
  description: string;
  rewardAmount: number; // Max 250
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  expiresAt: string;
}

export interface CreatePrivateChallengeRequest {
  recipientId: string;
  name: string;
  description: string;
  rewardAmount: number;
}

export interface PrivateChallengeResponse {
  challengeId: string;
  action: 'accept' | 'reject';
}

export interface DailyChallengeLimit {
  userId: string;
  challengesSent: number;
  maxChallenges: 3;
  resetTime: Date;
}
