/**
 * Main GraphQL API
 *
 * Clean, feature-based GraphQL layer using Apollo Client
 * Replaces the old messy dgraph.ts file
 */

// Export client
export { default as graphqlClient } from './client';

// Export fragments
export * from './fragments';

// Export features
export * from './features/user';
export * from './features/privateChallenge';

// Export utilities
export { generateId, normalizeWallet, generateRandomId } from './utils';

// Re-export user functions with old names for backward compatibility
export {
  getUserByWallet as getUserFromDgraph,
  getUserById as getUserByIdFromDgraph,
  fetchAllUsers,
  searchUsers,
  fetchUserFollowers,
  checkWalletExists,
  checkUsernameExists,
  getLeaderboard,
  getAllUserPushSubscriptions,
  registerUser,
  updateBio,
  updateProfilePicture,
  updateTrailerVideo,
  updateCoverPhoto,
  followUser,
  unfollowUser,
  toggleFollowUser,
  updateUserTokens,
  updateUserChallengeStrings,
  resetTimeBasedEarnings,
} from './features/user';

// Export specific functions from old dgraph.ts (not conflicting ones)
export {
  createNotification,
  fetchNotifications,
  fetchUnreadNotificationsCount,
  markNotificationsAsRead,
  generateInviteCode,
  validateInviteCode,
  markInviteAsUsed,
  handleChallengeCreation,
  getUserInviteStats,
  createRealMojiReaction,
  fetchFollowerCompletions,
  fetchLatestUserCompletion,
  fetchUserCompletions,
  getUserNFTsByType,
  toggleCompletionLike,
  updateUserEquippedItems,
  uploadRealMojiToIPFS,
  getUserAvatar,
} from '../api/dgraph';
