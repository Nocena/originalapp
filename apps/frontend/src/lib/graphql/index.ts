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

// Export utilities
export { generateId, normalizeWallet, generateRandomId } from './utils';

// Re-export user functions with old names for backward compatibility
export {
  getUserByWallet as getUserFromDgraph,
  getUserById as getUserByIdFromDgraph,
  // All other functions keep their names
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

// Temporary re-exports from old dgraph.ts
// These will be migrated incrementally
export * from '../api/dgraph';
