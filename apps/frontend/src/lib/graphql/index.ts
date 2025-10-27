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
export * from './features/user';
export * from './features/challenge-completion';
export * from './features/follow';
export * from './features/notification';
export * from './features/public-challenge';
export * from './features/private-challenge';
export * from './features/challenge';
export * from './features/reaction';
