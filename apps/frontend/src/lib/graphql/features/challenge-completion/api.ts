import graphqlClient from '../../client';
import {
  FETCH_ALL_COMPLETIONS,
  FETCH_COMPLETIONS_BY_CHALLENGE,
  FETCH_COMPLETIONS_OF_USERS,
  FETCH_LATEST_USER_COMPLETION,
  FETCH_USER_COMPLETIONS,
  GET_COMPLETION_FOR_LIKES,
} from './queries';
import { BasicCompletionType, FetchUserCompletionsParams, MediaMetadata } from './types';
import { getDateRange } from '../follow/utils';
import { addUserAccountToCompletions, fetchFollowingData, getLensAccountByAddress } from '../../../lens/api';
import { getDateParts, getEmojiForReactionType, serializeMedia } from './utils';
import { CREATE_CHALLENGE_COMPLETION, UPDATE_LIKE } from './mutations';
import { v4 as uuidv4 } from 'uuid';
import sanitizeDStorageUrl from '../../../../helpers/sanitizeDStorageUrl';
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
  challengeType: 'ai' | 'private' | 'public' = 'ai',
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


export async function fetchFollowingsCompletions(userLensAccountAddress: string,
                                                 date: string,
                                                 frequency: 'daily' | 'weekly' | 'monthly',
): Promise<BasicCompletionType[]> {
  try {
    const { startDate, endDate } = getDateRange(date, frequency);
    const followings = await fetchFollowingData(userLensAccountAddress);
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

export async function fetchChallengeCompletionsWithLikesAndReactions(
  challengeId?: string,
  userId?: string,
): Promise<BasicCompletionType[]> {
  try {
    const { data } = await graphqlClient.query({
      query: challengeId ? FETCH_COMPLETIONS_BY_CHALLENGE : FETCH_ALL_COMPLETIONS,
      variables: challengeId ? { challengeId } : undefined,
      fetchPolicy: 'no-cache',
    });

    let completions = data?.queryChallengeCompletion || [];
    await addUserAccountToCompletions(completions)

    return completions.map((completion: any) => ({
      ...completion,
      totalLikes: completion.likesCount || 0,
      isLiked: userId
        ? completion.likedByLensAccountIds?.includes(userId)
        : false,
      recentLikes: completion.likedByLensAccountIds?.slice(0, 5) || [],
      totalReactions: completion.reactions?.length || 0,
      recentReactions: (completion.reactions || []).map((reaction: any) => ({
        ...reaction,
        emoji: getEmojiForReactionType(reaction.reactionType),
        selfieUrl: sanitizeDStorageUrl(reaction.selfieCID),
      })),
    }));
  } catch (error) {
    console.error('❌ Error fetching completions with likes and reactions:', error);
    throw error;
  }
}


export async function createChallengeCompletion(
  userLensAccountId: string,
  challengeType: 'private' | 'public' | 'ai',
  mediaData: string | MediaMetadata,
  challengeId: string,
): Promise<string> {
  console.log('📘 Creating challenge completion', { userLensAccountId, challengeId, challengeType });

  const id = uuidv4();
  const now = new Date();
  const media = serializeMedia(mediaData);
  const { completionDate, completionDay, completionWeek, completionMonth, completionYear } = getDateParts(now);

  // Define challenge linkage based on type
  const privateChallenge = challengeType === 'private' ? { id: challengeId } : undefined;
  const publicChallenge = challengeType === 'public' ? { id: challengeId } : undefined;
  const aiChallenge = challengeType === 'ai' ? { id: challengeId } : undefined;

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
      },
    });

    console.log('✅ Challenge completion created:', data?.addChallengeCompletion?.challengeCompletion?.[0]?.id);

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
  completionId: string,
): Promise<{ isLiked: boolean; newLikeCount: number }> => {
  try {
    // 1️⃣ Validate user exists
    const userAccount = await getLensAccountByAddress(userLensAccountId);
    if (!userAccount) throw new Error("User not found");

    // 2️⃣ Fetch current completion data
    const { data } = await graphqlClient.query({
      query: GET_COMPLETION_FOR_LIKES,
      variables: { completionId },
      fetchPolicy: "network-only",
    });

    const completion = data?.getChallengeCompletion;
    if (!completion) throw new Error("Completion not found");

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
      fetchPolicy: "no-cache",
    });

    const updated =
      updateResponse.data?.updateChallengeCompletion?.challengeCompletion?.[0];

    if (!updated) throw new Error("Failed to update like state");

    return {
      isLiked: !alreadyLiked,
      newLikeCount: updated.likesCount ?? newLikeCount,
    };
  } catch (error) {
    console.error("Error toggling like:", error);
    throw error;
  }
};