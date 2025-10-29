import graphqlClient from '../../client';
import { v4 as uuidv4 } from 'uuid';
import * as mutations from './mutations';

export const createPublicChallenge = async (
  creatorLensAccountId: string,
  title: string,
  description: string,
  reward: number,
  latitude: number,
  longitude: number,
  maxParticipants: number = 100
): Promise<string> => {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  try {
    const { data } = await graphqlClient.mutate({
      mutation: mutations.CREATE_PUBLIC_CHALLENGE,
      variables: {
        input: [
          {
            id,
            title,
            description,
            reward,
            createdAt,
            isActive: true,
            creatorLensAccountId,
            location: { latitude, longitude },
            maxParticipants,
            participantCount: 0,
          },
        ],
      },
    });

    const createdChallenge = data?.addPublicChallenge?.publicChallenge?.[0];
    if (!createdChallenge) throw new Error('Challenge creation failed');

    console.log(`✅ Public challenge created: ${createdChallenge.id}`);
    return createdChallenge.id;
  } catch (error) {
    console.error('❌ Error creating public challenge:', error);
    throw error;
  }
};
