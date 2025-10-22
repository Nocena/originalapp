import graphqlClient from '../../client';
import { FETCH_LATEST_USER_COMPLETION, FETCH_USER_COMPLETIONS } from './queries';
import { FetchUserCompletionsParams } from './types';
// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

export async function fetchUserCompletions({
                                             userLensAccountId,
                                             startDate,
                                             endDate,
                                             challengeType,
                                           }: FetchUserCompletionsParams): Promise<any[]> {
  try {
    const { data } = await graphqlClient.query({
      query: FETCH_USER_COMPLETIONS,
      variables: {
        userLensAccountId,
        startDate,
        endDate,
        challengeType:
          challengeType === 'ai'
            ? 'ai'
            : challengeType === 'private'
              ? 'private'
              : challengeType === 'public'
                ? 'public'
                : null,
      },
    });

    const completions = data.queryChallengeCompletion || [];

    // Map the results to match CompletedChallenge type
    return completions.map((c: any) => ({
      id: c.id,
      media: c.media,
      completionDate: c.completionDate,
      completionDay: c.completionDay,
      completionWeek: c.completionWeek,
      completionMonth: c.completionMonth,
      completionYear: c.completionYear,
      status: c.status,
      challengeType: c.challengeType,
      likesCount: c.likesCount,
      userLensAccountId: c.userLensAccountId,
      aiChallenge: c.aiChallenge || null,
      privateChallenge: c.privateChallenge || null,
      publicChallenge: c.publicChallenge || null,
    }));
  } catch (error) {
    console.error('Error fetching user completions:', error);
    throw error;
  }
}

export async function fetchLatestUserCompletion(
  userLensAccountId: string,
  challengeType: 'ai' | 'private' | 'public' = 'ai'
): Promise<any | null> {
  try {
    const { data } = await graphqlClient.query({
      query: FETCH_LATEST_USER_COMPLETION,
      variables: {
        userLensAccountId,
        challengeType, // directly 'ai', 'private', 'public'
      },
    });

    const completions = data.queryChallengeCompletion || [];

    if (completions.length === 0) return null;

    const c = completions[0];

    return {
      id: c.id,
      media: c.media,
      completionDate: c.completionDate,
      completionDay: c.completionDay,
      completionWeek: c.completionWeek,
      completionMonth: c.completionMonth,
      completionYear: c.completionYear,
      status: c.status,
      challengeType: c.challengeType,
      likesCount: c.likesCount,
      userLensAccountId: c.userLensAccountId,
      aiChallenge: c.aiChallenge || null,
      privateChallenge: c.privateChallenge || null,
      publicChallenge: c.publicChallenge || null,
    };
  } catch (error) {
    console.error('Error fetching latest user completion:', error);
    throw error;
  }
}