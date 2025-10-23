import graphqlClient from '../../client';
import { FETCH_COMPLETIONS_OF_USERS, FETCH_LATEST_USER_COMPLETION, FETCH_USER_COMPLETIONS } from './queries';
import { BasicCompletionType, FetchUserCompletionsParams } from './types';
import { getDateRange } from '../follow/utils';
import { fetchFollowingData } from '../../../lens/api';
// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

export async function fetchUserCompletions({
                                             userLensAccountId,
                                             startDate,
                                             endDate,
                                             challengeType,
                                           }: FetchUserCompletionsParams): Promise<BasicCompletionType[]> {
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


export async function fetchFollowingsCompletions(  userLensAccountAddress: string,
                                                   date: string,
                                                   frequency: 'daily' | 'weekly' | 'monthly'
): Promise<BasicCompletionType[]> {
  try {
    const { startDate, endDate } = getDateRange(date, frequency);
    const followings = await fetchFollowingData(userLensAccountAddress)
    const followingAccountAddresses = followings?.items.map(item => item.following.address) || [];

    const { data } = await graphqlClient.query({
      query: FETCH_COMPLETIONS_OF_USERS,
      variables: {
        userLensAccountIds: followingAccountAddresses,
        startDate,
        endDate,
        challengeType: 'ai',
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
      userAccount: followings?.items.find(item => item.following.address === c.userLensAccountId)?.following || null,
    }));
  } catch (error) {
    console.error('Error fetching user completions:', error);
    throw error;
  }
}
