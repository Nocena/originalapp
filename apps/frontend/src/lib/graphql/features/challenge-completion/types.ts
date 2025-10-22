export interface FetchUserCompletionsParams {
  userLensAccountId: string;
  startDate: string;
  endDate: string;
  challengeType?: 'ai' | 'private' | 'public';
}