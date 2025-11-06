/**
 * Complete Private Challenge API
 *
 * Mark a challenge as completed and create completion record.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { updatePrivateChallengeStatus } from '../../../lib/api/dgraph';
import { createChallengeCompletion } from '../../../lib/graphql/features/challenge-completion/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { challengeId, userId, mediaData } = req.body;

    if (!challengeId || !userId) {
      return res.status(400).json({ error: 'Challenge ID and User ID are required' });
    }

    // Create completion record with proper JSON media data
    const defaultMedia = {
      type: 'completion',
      data: 'Private challenge completed',
      videoCID: '',
      selfieCID: '',
      previewCID: '',
    };

    const completionId = await createChallengeCompletion(
      userId,
      challengeId,
      'private',
      mediaData || defaultMedia
    );

    // Update challenge status
    const success = await updatePrivateChallengeStatus(challengeId, false, true);

    if (!success) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Challenge completed successfully',
      completionId,
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
