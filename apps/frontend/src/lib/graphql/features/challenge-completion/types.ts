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