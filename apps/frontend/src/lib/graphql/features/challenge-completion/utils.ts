import { BasicCompletionType, ChallengeCompletion, MediaMetadata } from './types';
import sanitizeDStorageUrl from '../../../../helpers/sanitizeDStorageUrl';
import { addUserAccountToCompletions } from '../../../lens/api';

/**
 * Helper function to get emoji for reaction type
 * @param reactionType - The reaction type string
 * @returns string - The corresponding emoji
 */
export const getEmojiForReactionType = (reactionType: string): string => {
  const emojiMap: { [key: string]: string } = {
    thumbsUp: '👍',
    love: '😍',
    shocked: '🤯',
    curious: '🤔',
    fire: '🔥',
    sad: '😢',
  };
  return emojiMap[reactionType] || '😊';
};

export const getDateParts = (date: Date) => ({
  completionDate: date.toISOString(),
  completionDay: date.getDate(),
  completionWeek: Math.ceil(
    (date.getDate() + (new Date(date.getFullYear(), 0, 1).getDay() + 1)) / 7
  ),
  completionMonth: date.getMonth() + 1,
  completionYear: date.getFullYear(),
});

export const serializeMedia = (mediaData: string | MediaMetadata): string => {
  const now = Date.now();
  if (typeof mediaData === 'string') {
    return JSON.stringify({
      directoryCID: mediaData,
      hasVideo: false,
      hasSelfie: false,
      timestamp: now,
    });
  }
  return JSON.stringify({ ...mediaData, timestamp: mediaData.timestamp || now });
};

export const getChallengeCompletionObjectFrom = async (
  rawCompletions: BasicCompletionType[],
  userId?: string
): Promise<ChallengeCompletion[]> => {
  const updatedCompletions = rawCompletions.map((completion: any) => {
    let videoUrl: string | undefined;
    let selfieUrl: string | undefined;
    let previewUrl: string | undefined;

    // --- Parse media and extract CIDs ---
    try {
      const media = JSON.parse(completion.media || '{}');
      let { videoCID, selfieCID, previewCID } = media;

      // Handle nested CID structure
      if (!videoCID && !selfieCID && media.directoryCID) {
        try {
          const directoryData = JSON.parse(media.directoryCID);
          videoCID = directoryData.videoCID;
          selfieCID = directoryData.selfieCID;
          previewCID = directoryData.previewCID;
        } catch (dirParseError) {
          console.error('Error parsing directory CID:', dirParseError);
        }
      }

      if (videoCID) videoUrl = sanitizeDStorageUrl(videoCID);
      if (selfieCID) selfieUrl = sanitizeDStorageUrl(selfieCID);
      if (previewCID) previewUrl = sanitizeDStorageUrl(previewCID);
    } catch (parseError) {
      console.error('Error parsing media for completion:', parseError);
    }

    // --- Return enriched object ---
    return {
      ...completion,
      videoUrl,
      selfieUrl,
      previewUrl,

      // Derived / computed fields
      totalLikes: completion.likesCount || 0,
      isLiked: userId ? completion.likedByLensAccountIds?.includes(userId) : false,
      recentLikes: completion.likedByLensAccountIds?.slice(0, 5) || [],

      totalReactions: completion.reactions?.length || 0,
      recentReactions: (completion.reactions || []).map((reaction: any) => ({
        ...reaction,
        emoji: getEmojiForReactionType(reaction.reactionType),
        selfieUrl: sanitizeDStorageUrl(reaction.selfieCID),
      })),

      localLikes: completion.likesCount || 0,
      localIsLiked: userId ? completion.likedByLensAccountIds?.includes(userId) : false,
    } as ChallengeCompletion;
  });

  await addUserAccountToCompletions(updatedCompletions);

  return updatedCompletions;
};
