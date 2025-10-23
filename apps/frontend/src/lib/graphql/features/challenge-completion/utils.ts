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
