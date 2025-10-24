import graphqlClient from '../../client';
import {
  FETCH_ALL_COMPLETIONS, FETCH_COMPLETIONS_BY_CHALLENGE,
  FETCH_COMPLETIONS_OF_USERS,
  FETCH_LATEST_USER_COMPLETION,
  FETCH_USER_COMPLETIONS,
} from './queries';
import { BasicCompletionType, FetchUserCompletionsParams, MediaMetadata } from './types';
import { getDateRange } from '../follow/utils';
import { fetchFollowingData } from '../../../lens/api';
import { getDateParts, getEmojiForReactionType, serializeMedia } from './utils';
import { CREATE_CHALLENGE_COMPLETION } from './mutations';
import { v4 as uuidv4 } from 'uuid';
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

    const completions = data?.queryChallengeCompletion || [];

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
        selfieUrl: reaction.selfieCID
          ? `https://gateway.pinata.cloud/ipfs/${reaction.selfieCID}`
          : null,
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