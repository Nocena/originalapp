import { AccountFragment } from '@nocena/indexer';

export interface FetchUserCompletionsParams {
  userLensAccountId: string;
  startDate: string;
  endDate: string;
  challengeType?: 'ai' | 'private' | 'public';
}

export interface BasicCompletionType {
  id: any;
  media: any;
  completionDate: any;
  completionDay: any;
  completionWeek: any;
  completionMonth: any;
  completionYear: any;
  status: any;
  challengeType: any;
  likesCount: any;
  userLensAccountId: any;
  aiChallenge: any;
  privateChallenge: any;
  publicChallenge: any;
  userAccount?: AccountFragment;
}

export interface ChallengeCompletion extends BasicCompletionType {
  videoUrl?: string;
  selfieUrl?: string;
  // Local state for likes (will be replaced with DB data later)
  localLikes?: number;
  localIsLiked?: boolean;
  // Database fields for likes
  totalLikes?: number;
  isLiked?: boolean;
  recentLikes?: Array<{
    id: string;
    username: string;
    profilePicture: string;
  }>;
  // Database fields for reactions
  totalReactions?: number;
  recentReactions?: Array<{
    id: string;
    reactionType: string;
    emoji: string;
    selfieUrl?: string;
    user: {
      id: string;
      username: string;
      profilePicture: string;
    };
    createdAt: string;
  }>;
}
