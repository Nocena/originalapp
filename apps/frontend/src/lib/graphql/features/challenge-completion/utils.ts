import { MediaMetadata } from './types';

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
