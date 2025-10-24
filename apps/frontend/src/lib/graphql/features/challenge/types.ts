export interface CompletionData {
  userLensAccountId: string;
  completedAt: string;
}

export interface ChallengeData {
  id: string;
  position: [number, number]; // [longitude, latitude]
  title: string;
  description: string;
  reward: number;
  color: string;
  creatorLensAccountId: string;
  participantCount: number;
  maxParticipants: number;
  completionCount: number;
  recentCompletions: CompletionData[];
}