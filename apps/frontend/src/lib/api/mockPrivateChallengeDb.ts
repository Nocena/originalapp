// Mock Database Service for Private Challenges
// This mimics the real Dgraph interface for easy swapping later

import { PrivateChallengeInvite } from '../../types/notifications';

// Use global storage to persist across API requests
declare global {
  var mockPrivateChallenges: Map<string, PrivateChallengeInvite> | undefined;
}

// Initialize global storage if it doesn't exist
if (!global.mockPrivateChallenges) {
  global.mockPrivateChallenges = new Map<string, PrivateChallengeInvite>();
}

const mockChallenges = global.mockPrivateChallenges;

/**
 * Check if a challenge has expired (24 hour limit)
 */
function isExpired(challenge: PrivateChallengeInvite): boolean {
  const now = new Date();
  const expiresAt = new Date(challenge.expiresAt);
  return now > expiresAt;
}

/**
 * Auto-expire pending challenges that are past 24 hours
 */
function checkAndExpireChallenges(challenges: PrivateChallengeInvite[]): PrivateChallengeInvite[] {
  return challenges.map((challenge) => {
    if (challenge.status === 'pending' && isExpired(challenge)) {
      challenge.status = 'expired';
      mockChallenges.set(challenge.id, challenge);
    }
    return challenge;
  });
}

// Database interface (matches what real Dgraph service would look like)
export interface PrivateChallengeDbService {
  createChallenge(
    challenge: Omit<PrivateChallengeInvite, 'id' | 'createdAt'>
  ): Promise<PrivateChallengeInvite>;
  getChallengesByRecipient(recipientId: string): Promise<PrivateChallengeInvite[]>;
  getChallengesByCreator(creatorId: string): Promise<PrivateChallengeInvite[]>;
  updateChallengeStatus(
    challengeId: string,
    status: PrivateChallengeInvite['status']
  ): Promise<boolean>;
  getChallenge(challengeId: string): Promise<PrivateChallengeInvite | null>;
}

// Mock implementation (replace with real Dgraph service later)
class MockPrivateChallengeDb implements PrivateChallengeDbService {
  async createChallenge(
    challengeData: Omit<PrivateChallengeInvite, 'id' | 'createdAt'>
  ): Promise<PrivateChallengeInvite> {
    const now = new Date();
    const challenge: PrivateChallengeInvite = {
      ...challengeData,
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now.toISOString(),
      // Ensure 24-hour expiration is set
      expiresAt:
        challengeData.expiresAt || new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };

    mockChallenges.set(challenge.id, challenge);
    return challenge;
  }

  async getChallengesByRecipient(recipientId: string): Promise<PrivateChallengeInvite[]> {
    const challenges = Array.from(mockChallenges.values()).filter(
      (challenge) => challenge.recipientId === recipientId
    );
    return checkAndExpireChallenges(challenges);
  }

  async getChallengesByCreator(creatorId: string): Promise<PrivateChallengeInvite[]> {
    const challenges = Array.from(mockChallenges.values()).filter(
      (challenge) => challenge.creatorId === creatorId
    );
    return checkAndExpireChallenges(challenges);
  }

  async updateChallengeStatus(
    challengeId: string,
    status: PrivateChallengeInvite['status']
  ): Promise<boolean> {
    const challenge = mockChallenges.get(challengeId);
    if (!challenge) return false;

    // Don't allow status changes on expired challenges
    if (isExpired(challenge) && challenge.status === 'pending') {
      challenge.status = 'expired';
      mockChallenges.set(challengeId, challenge);
      return false;
    }

    challenge.status = status;
    mockChallenges.set(challengeId, challenge);
    return true;
  }

  // Clear completed challenges for a user
  async clearCompletedChallenges(userId: string): Promise<number> {
    const initialSize = mockChallenges.size;
    const challengesToRemove: string[] = [];

    for (const [id, challenge] of mockChallenges.entries()) {
      const isCompleted = ['completed', 'rejected', 'expired', 'failed'].includes(challenge.status);
      const isUserInvolved = challenge.creatorId === userId || challenge.recipientId === userId;
      if (isCompleted && isUserInvolved) {
        challengesToRemove.push(id);
      }
    }

    challengesToRemove.forEach((id) => mockChallenges.delete(id));
    const clearedCount = challengesToRemove.length;
    console.log(`Cleared ${clearedCount} completed challenges for user ${userId}`);
    return clearedCount;
  }

  async getChallenge(challengeId: string): Promise<PrivateChallengeInvite | null> {
    const challenge = mockChallenges.get(challengeId);
    if (!challenge) return null;

    // Auto-expire if needed
    if (challenge.status === 'pending' && isExpired(challenge)) {
      challenge.status = 'expired';
      mockChallenges.set(challengeId, challenge);
    }

    return challenge;
  }
}

// Export the service instance
// TODO: Replace with real Dgraph service when ready
export const privateChallengeDb: PrivateChallengeDbService = new MockPrivateChallengeDb();

// Real Dgraph implementation would look like:
// export const privateChallengeDb: PrivateChallengeDbService = new DgraphPrivateChallengeDb();
