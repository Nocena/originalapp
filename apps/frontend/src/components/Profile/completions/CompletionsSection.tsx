import React, { useMemo } from 'react';
import CompletedChallengePart from './CompletedChallengePart';
import SimilarChallengeCompletionsPart from './SimilarChallengeCompletionsPart';
import { useUserChallengeCompletions } from 'src/lib/graphql/features/challenge-completion/hook/useUserChallengeCompletions';

interface CompletionsSectionProps {
  userID: string;
}

const CompletionsSection: React.FC<CompletionsSectionProps> = ({ userID = 'current-user' }) => {
  const { completions, loading } = useUserChallengeCompletions(userID);
  const completedChallengeIds = useMemo(() => {
    return completions.map(
      (completion) =>
        completion.aiChallengeId ||
        completion.privateChallengeId ||
        completion.publicChallengeId ||
        ''
    );
  }, [completions, loading]);
  console.log('completions completedChallengeIds', completions, completedChallengeIds);
  return (
    <>
      <CompletedChallengePart userID={userID} completions={completions} loading={loading} />
      <SimilarChallengeCompletionsPart userID={userID} challengeIds={completedChallengeIds} />
    </>
  );
};

export default CompletionsSection;
