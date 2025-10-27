// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

import { generateId } from '../../utils';
import { createNotification, graphqlClient } from '../../index';
import { CREATE_REACTION } from './mutations';
import { GET_COMPLETION_OWNER } from './queries';

/**
 * Create a RealMoji reaction for a challenge completion
 * @param userLensAccountId - ID of the user reacting
 * @param completionId - ID of the challenge completion
 * @param reactionType - Type of reaction (e.g., thumbsUp, love, shocked)
 * @param selfieCID - IPFS CID of the selfie image
 * @returns Promise<string> - The created reaction ID
 */
export const createRealMojiReaction = async (
  userLensAccountId: string,
  completionId: string,
  reactionType: string,
  selfieCID: string
): Promise<string> => {
  try {
    const reactionId = generateId();
    const createdAt = new Date().toISOString();

    console.log(
      `Creating RealMoji reaction (${reactionType}) for completion ${completionId} by ${userLensAccountId}`
    );

    // Step 1️⃣ Create reaction
    const { data: reactionData } = await graphqlClient.mutate({
      mutation: CREATE_REACTION,
      variables: {
        id: reactionId,
        userLensAccountId,
        completionId,
        reactionType,
        selfieCID,
        createdAt,
      },
    });

    const newReaction = reactionData?.addReaction?.reaction?.[0];
    if (!newReaction) throw new Error("Failed to create reaction");

    // Step 2️⃣ Fetch completion owner (to notify)
    const { data: completionData } = await graphqlClient.query({
      query: GET_COMPLETION_OWNER,
      variables: { completionId },
      fetchPolicy: "network-only",
    });

    const completionOwnerId =
      completionData?.getChallengeCompletion?.userLensAccountId;

    // Step 3️⃣ Send notification (skip if reacting to own post)
    if (completionOwnerId && completionOwnerId !== userLensAccountId) {
      try {
        await createNotification(
          {
            userLensAccountId: completionOwnerId,
            triggeredByLensAccountId: userLensAccountId,
            content: `reacted with a ${reactionType} RealMoji to your challenge`,
            notificationType: "reaction"
          }
        );
      } catch (err) {
        console.error("Failed to send reaction notification:", err);
      }
    }

    console.log(`✅ RealMoji reaction created: ${reactionId}`);
    return reactionId;
  } catch (error) {
    console.error("❌ Error creating RealMoji reaction:", error);
    throw error;
  }
};