import React, { useMemo } from 'react';
import CompletedChallengePart from '@pages/profile/components/completions/CompletedChallengePart';
import SimilarChallengeCompletionsPart from '@pages/profile/components/completions/SimilarChallengeCompletionsPart';
import { useUserChallengeCompletions } from '../../../../lib/graphql/features/challenge-completion/hook';

interface CompletionsSectionProps {
  userID: string;
}

const CompletionsSection: React.FC<CompletionsSectionProps> = ({
                                                                 userID = 'current-user',
                                                               }) => {
  const { completions, loading } = useUserChallengeCompletions(userID);
  const completedChallengeIds = useMemo(() => {
    return completions.map((completion) => completion.aiChallenge?.id || completion.privateChallenge?.id || completion.publicChallenge?.id)
  }, [completions, loading])
  return (
    <>
      <CompletedChallengePart
        userID={userID}
        completions={completions}
        loading={loading}
      />
      <SimilarChallengeCompletionsPart
        userID={userID}
        challengeIds={completedChallengeIds}
      />
    </>
  );
};

export default CompletionsSection;
