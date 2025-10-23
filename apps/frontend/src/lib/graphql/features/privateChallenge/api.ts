/**
 * Private Challenge API
 *
 * GraphQL operations for private challenges between users.
 * NOTE: Currently not used - Dgraph PrivateChallenge schema not deployed.
 * See mockPrivateChallengeDb.ts for temporary implementation.
 */

import graphqlClient from '../../client';
import * as queries from './queries';
import * as mutations from './mutations';
import { generateId } from '../../utils';

export interface PrivateChallengeData {
  id?: string;
  title: string;
  description: string;
  reward: number;
  creatorId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  expiresAt: string;
  createdAt?: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

/**
 * Create a new private challenge
 * NOTE: Not currently used - Dgraph schema not deployed
 */
export async function createPrivateChallenge(
  data: Omit<PrivateChallengeData, 'id' | 'createdAt'>
): Promise<any> {
  try {
    const challengeId = generateId();
    const now = new Date();
    const createdAt = now.toISOString();

    const input = {
      id: challengeId,
      title: data.title,
      description: data.description,
      reward: data.reward,
      createdAt,
      expiresAt: data.expiresAt,
      isActive: true,
      isCompleted: false,
      creator: { id: data.creatorId },
      targetUser: { id: data.recipientId },
    };

    const response = await graphqlClient.mutate({
      mutation: mutations.CREATE_PRIVATE_CHALLENGE,
      variables: { input },
    });

    console.log('GraphQL Response:', JSON.stringify(response, null, 2));

    if (!response.data?.addPrivateChallenge) {
      throw new Error('No data returned from mutation');
    }

    return response.data.addPrivateChallenge.privateChallenge[0];
  } catch (error) {
    console.error('Error creating private challenge:', error);
    throw error;
  }
}

/**
 * Get challenges received by a user
 * NOTE: Not currently used - Dgraph schema not deployed
 */
export async function getChallengesByRecipient(recipientId: string): Promise<any[]> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.GET_CHALLENGES_BY_RECIPIENT,
      variables: { recipientId },
      fetchPolicy: 'network-only',
    });

    return data.queryPrivateChallenge || [];
  } catch (error) {
    console.error('Error fetching challenges by recipient:', error);
    return [];
  }
}

/**
 * Get challenges created by a user
 * NOTE: Not currently used - Dgraph schema not deployed
 */
export async function getChallengesByCreator(creatorId: string): Promise<any[]> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.GET_CHALLENGES_BY_CREATOR,
      variables: { creatorId },
      fetchPolicy: 'network-only',
    });

    return data.queryPrivateChallenge || [];
  } catch (error) {
    console.error('Error fetching challenges by creator:', error);
    return [];
  }
}

/**
 * Update challenge status (accept/reject/complete)
 * NOTE: Not currently used - Dgraph schema not deployed
 */
export async function updateChallengeStatus(
  challengeId: string,
  isCompleted: boolean,
  isActive: boolean
): Promise<boolean> {
  try {
    await graphqlClient.mutate({
      mutation: mutations.UPDATE_CHALLENGE_STATUS,
      variables: { id: challengeId, isCompleted, isActive },
    });

    return true;
  } catch (error) {
    console.error('Error updating challenge status:', error);
    return false;
  }
}

export async function getChallengeById(challengeId: string): Promise<any | null> {
  try {
    const { data } = await graphqlClient.query({
      query: queries.GET_CHALLENGE_BY_ID,
      variables: { id: challengeId },
      fetchPolicy: 'network-only',
    });

    return data.getPrivateChallenge || null;
  } catch (error) {
    console.error('Error fetching challenge by ID:', error);
    return null;
  }
}
