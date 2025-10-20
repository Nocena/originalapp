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

// Database interface (matches what real Dgraph service would look like)
export interface PrivateChallengeDbService {
  createChallenge(challenge: Omit<PrivateChallengeInvite, 'id' | 'createdAt'>): Promise<PrivateChallengeInvite>;
  getChallengesByRecipient(recipientId: string): Promise<PrivateChallengeInvite[]>;
  getChallengesByCreator(creatorId: string): Promise<PrivateChallengeInvite[]>;
  updateChallengeStatus(challengeId: string, status: PrivateChallengeInvite['status']): Promise<boolean>;
  getChallenge(challengeId: string): Promise<PrivateChallengeInvite | null>;
}

// Mock implementation (replace with real Dgraph service later)
class MockPrivateChallengeDb implements PrivateChallengeDbService {
  async createChallenge(challengeData: Omit<PrivateChallengeInvite, 'id' | 'createdAt'>): Promise<PrivateChallengeInvite> {
    const challenge: PrivateChallengeInvite = {
      ...challengeData,
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    mockChallenges.set(challenge.id, challenge);
    return challenge;
  }

  async getChallengesByRecipient(recipientId: string): Promise<PrivateChallengeInvite[]> {
    return Array.from(mockChallenges.values()).filter(
      challenge => challenge.recipientId === recipientId
    );
  }

  async getChallengesByCreator(creatorId: string): Promise<PrivateChallengeInvite[]> {
    return Array.from(mockChallenges.values()).filter(
      challenge => challenge.creatorId === creatorId
    );
  }

  async updateChallengeStatus(challengeId: string, status: PrivateChallengeInvite['status']): Promise<boolean> {
    const challenge = mockChallenges.get(challengeId);
    if (!challenge) return false;

    challenge.status = status;
    mockChallenges.set(challengeId, challenge);
    return true;
  }

  async getChallenge(challengeId: string): Promise<PrivateChallengeInvite | null> {
    console.log('Looking for challenge:', challengeId);
    console.log('Available challenges:', Array.from(mockChallenges.keys()));
    return mockChallenges.get(challengeId) || null;
  }
}

// Export the service instance
// TODO: Replace with real Dgraph service when ready
export const privateChallengeDb: PrivateChallengeDbService = new MockPrivateChallengeDb();

// Real Dgraph implementation would look like:
// export const privateChallengeDb: PrivateChallengeDbService = new DgraphPrivateChallengeDb();
