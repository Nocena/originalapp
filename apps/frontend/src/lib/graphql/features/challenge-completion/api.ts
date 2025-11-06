import graphqlClient from '../../client';
import {
  CHECK_CHALLENGE_COMPLETION,
  FETCH_ALL_COMPLETIONS,
  FETCH_COMPLETION_BY_COMPLETION_ID,
  FETCH_COMPLETIONS_BY_CHALLENGE,
  FETCH_COMPLETIONS_OF_USER_FOR_CALENDAR,
  FETCH_COMPLETIONS_OF_USERS,
  FETCH_LATEST_USER_COMPLETION,
  FETCH_USER_COMPLETIONS_BY_FILTERS,
  GET_COMPLETION_FOR_LIKES,
  GET_USERS_WITH_COMPLETIONS,
  USER_CHALLENGE_COMPLETIONS,
  USER_SIMILAR_CHALLENGE_COMPLETIONS,
} from './queries';
import {
  BasicCompletionType,
  ChallengeCompletion,
  FetchUserCompletionsForCalendarParams,
  FetchUserCompletionsParams,
  MediaMetadata,
  UserCompletionsCalendar,
} from './types';
import { getDateRange } from '../follow/utils';
import { fetchFollowingData, getLensAccountByAddress } from '../../../lens/api';
import { getChallengeCompletionObjectFrom, getDateParts, serializeMedia } from './utils';
import { CREATE_CHALLENGE_COMPLETION, UPDATE_LIKE } from './mutations';
import { v4 as uuidv4 } from 'uuid';
// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

export async function isChallengeCompletedByUser(
  userLensAccountId: string,
  challengeId: string
): Promise<boolean> {
  try {
    const { data } = await graphqlClient.query({
      query: CHECK_CHALLENGE_COMPLETION,
      variables: { userLensAccountId, challengeId },
      fetchPolicy: 'network-only',
    });

    const completions = data?.queryChallengeCompletion ?? [];
    return completions.length > 0;
  } catch (error) {
    console.error('❌ Error checking challenge completion:', error);
    return false;
  }
}

export const fetchAllUserChallengeCompletionsPaginate = async (
  userLensAccountId: string,
  limit = 10,
  offset = 0
): Promise<ChallengeCompletion[]> => {
  const { data } = await graphqlClient.query({
    query: USER_CHALLENGE_COMPLETIONS,
    variables: { userLensAccountId, limit, offset },
    fetchPolicy: 'network-only',
  });

  const rawCompletions = data?.queryChallengeCompletion ?? [];
  return await getChallengeCompletionObjectFrom(rawCompletions, userLensAccountId);
};

export const fetchUserSimilarChallengeCompletionsPaginate = async (
  userLensAccountId: string,
  challengeIds: string[],
  limit = 10,
  offset = 0
): Promise<ChallengeCompletion[]> => {
  const { data } = await graphqlClient.query({
    query: USER_SIMILAR_CHALLENGE_COMPLETIONS,
    variables: { userLensAccountId, challengeIds, limit, offset },
    fetchPolicy: 'network-only',
  });

  const rawCompletions = data?.queryChallengeCompletion ?? [];
  return await getChallengeCompletionObjectFrom(rawCompletions, userLensAccountId);
};

export async function fetchUserCompletionsByFilters({
  userLensAccountId,
  startDate,
  endDate,
  challengeType,
}: FetchUserCompletionsParams): Promise<BasicCompletionType[]> {
  try {
    const { data } = await graphqlClient.query({
      query: FETCH_USER_COMPLETIONS_BY_FILTERS,
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
    return completions as BasicCompletionType[];
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

    return completions[0];
  } catch (error) {
    console.error('Error fetching latest user completion:', error);
    throw error;
  }
}

export async function fetchFollowingsCompletions(
  userLensAccountAddress: string,
  date: string,
  frequency: 'daily' | 'weekly' | 'monthly'
): Promise<BasicCompletionType[]> {
  try {
    const { startDate, endDate } = getDateRange(date, frequency);
    const followings = await fetchFollowingData(userLensAccountAddress);
    const followingAccountAddresses = followings?.items.map((item) => item.following.address) || [];

    if (followingAccountAddresses.length <= 0) return [];

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
      ...c,
      userAccount:
        followings?.items.find((item) => item.following.address === c.userLensAccountId)
          ?.following || null,
    }));
  } catch (error) {
    console.error('Error fetching user completions:', error);
    throw error;
  }
}

export async function fetchChallengeCompletionsWithLikesAndReactions(
  challengeId?: string,
  userId?: string
): Promise<ChallengeCompletion[]> {
  try {
    const { data } = await graphqlClient.query({
      query: challengeId ? FETCH_COMPLETIONS_BY_CHALLENGE : FETCH_ALL_COMPLETIONS,
      variables: challengeId ? { challengeId } : undefined,
      fetchPolicy: 'no-cache',
    });

    let completions = data?.queryChallengeCompletion || [];
    return await getChallengeCompletionObjectFrom(completions, userId);
  } catch (error) {
    console.error('❌ Error fetching completions with likes and reactions:', error);
    throw error;
  }
}

export async function fetchChallengeCompletionById(
  completionId: string,
  userId?: string
): Promise<ChallengeCompletion> {
  try {
    const { data } = await graphqlClient.query({
      query: FETCH_COMPLETION_BY_COMPLETION_ID,
      variables: { completionId },
      fetchPolicy: 'no-cache',
    });

    let completions = data?.queryChallengeCompletion || [];
    const updatedCompletions = await getChallengeCompletionObjectFrom(completions, userId);
    return updatedCompletions[0];
  } catch (error) {
    console.error('❌ Error fetching completions with likes and reactions:', error);
    throw error;
  }
}

export async function createChallengeCompletion(
  userLensAccountId: string,
  challengeType: 'private' | 'public' | 'ai',
  mediaData: string | MediaMetadata,
  challengeId: string
): Promise<string> {
  console.log('📘 Creating challenge completion', {
    userLensAccountId,
    challengeId,
    challengeType,
  });

  const id = uuidv4();
  const now = new Date();
  const media = serializeMedia(mediaData);
  const { completionDate, completionDay, completionWeek, completionMonth, completionYear } =
    getDateParts(now);

  // Define challenge linkage based on type
  const privateChallenge = challengeType === 'private' ? { id: challengeId } : undefined;
  const publicChallenge = challengeType === 'public' ? { id: challengeId } : undefined;
  const aiChallenge = challengeType === 'ai' ? { id: challengeId } : undefined;
  // Assign the correct challenge ID field based on type
  const privateChallengeId = challengeType === 'private' ? challengeId : null;
  const publicChallengeId = challengeType === 'public' ? challengeId : null;
  const aiChallengeId = challengeType === 'ai' ? challengeId : null;

  try {
    const { data } = await graphqlClient.mutate({
      mutation: CREATE_CHALLENGE_COMPLETION,
      variables: {
        id,
        userLensAccountId,
        challengeId,
        media,
        completionDate,
        completionDay,
        completionWeek,
        completionMonth,
        completionYear,
        challengeType,
        privateChallenge,
        publicChallenge,
        aiChallenge,
        privateChallengeId,
        publicChallengeId,
        aiChallengeId,
      },
    });

    console.log(
      '✅ Challenge completion created:',
      data?.addChallengeCompletion?.challengeCompletion?.[0]?.id
    );

    // Extra logic for AI challenges
    /*
        if (challengeType === 'ai') {
          try {
            await updateUserChallengeStrings(userLensAccountId);
          } catch (e) {
            console.warn('⚠️ Error updating user challenge strings:', e);
          }
        }
    */

    return id;
  } catch (error) {
    console.error('❌ Error creating challenge completion:', error);
    throw error;
  }
}

/**
 * Toggle like on a challenge completion
 * @param userLensAccountId - ID of the user liking/unliking
 * @param completionId - ID of the challenge completion
 */
export const toggleCompletionLike = async (
  userLensAccountId: string,
  completionId: string
): Promise<{ isLiked: boolean; newLikeCount: number }> => {
  try {
    // 1️⃣ Validate user exists
    const userAccount = await getLensAccountByAddress(userLensAccountId);
    if (!userAccount) throw new Error('User not found');

    // 2️⃣ Fetch current completion data
    const { data } = await graphqlClient.query({
      query: GET_COMPLETION_FOR_LIKES,
      variables: { completionId },
      fetchPolicy: 'network-only',
    });

    const completion = data?.getChallengeCompletion;
    if (!completion) throw new Error('Completion not found');

    const likedBy: string[] = completion.likedByLensAccountIds || [];
    const alreadyLiked = likedBy.includes(userLensAccountId);

    // 3️⃣ Compute updated state
    const updatedLikedBy = alreadyLiked
      ? likedBy.filter((id) => id !== userLensAccountId)
      : [...likedBy, userLensAccountId];

    const newLikeCount = alreadyLiked
      ? Math.max(0, (completion.likesCount || 0) - 1)
      : (completion.likesCount || 0) + 1;

    // 🧠 Dgraph sometimes fails to update arrays if we send an empty array directly
    // So we guard it with explicit empty [] handling
    const safeLikedBy = updatedLikedBy.length > 0 ? updatedLikedBy : [];

    // 4️⃣ Update mutation
    const updateResponse = await graphqlClient.mutate({
      mutation: UPDATE_LIKE,
      variables: {
        completionId,
        likedByLensAccountIds: safeLikedBy,
        likesCount: newLikeCount,
      },
      fetchPolicy: 'no-cache',
    });

    const updated = updateResponse.data?.updateChallengeCompletion?.challengeCompletion?.[0];

    if (!updated) throw new Error('Failed to update like state');

    return {
      isLiked: !alreadyLiked,
      newLikeCount: updated.likesCount ?? newLikeCount,
    };
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

/**
 * Fetch Lens account IDs that have completed at least one challenge.
 *
 * @param userLensAccountIds - Array of Lens account IDs to check.
 * @returns Promise<string[]> Unique userLensAccountIds with completions.
 */
export async function getUsersWithCompletions(userLensAccountIds: string[]): Promise<string[]> {
  if (!userLensAccountIds?.length) return [];

  try {
    const { data } = await graphqlClient.query({
      query: GET_USERS_WITH_COMPLETIONS,
      variables: { userLensAccountIds },
      fetchPolicy: 'no-cache',
    });

    const completions = data?.queryChallengeCompletion ?? [];

    // Deduplicate userLensAccountIds
    return Array.from(new Set(completions.map((c: any) => c.userLensAccountId)));
  } catch (error) {
    console.error('❌ Error fetching users with completions:', error);
    throw error;
  }
}

export async function fetchUserCompletionsForCalendar({
  userLensAccountId,
}: FetchUserCompletionsForCalendarParams): Promise<UserCompletionsCalendar> {
  try {
    const { data } = await graphqlClient.query({
      query: FETCH_COMPLETIONS_OF_USER_FOR_CALENDAR,
      variables: {
        userLensAccountId,
      },
    });

    const completions = data.queryChallengeCompletion || [];
    const result: UserCompletionsCalendar = {
      daily: [],
      weekly: [],
      monthly: [],
    };

    for (const completion of completions) {
      if (completion.aiChallenge) {
        const { frequency, day, week, month } = completion.aiChallenge;
        if (frequency === 'daily') result.daily.push(day);
        else if (frequency === 'weekly') result.weekly.push(week);
        else if (frequency === 'monthly') result.monthly.push(month);
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching user completions:', error);
    throw error;
  }
}
