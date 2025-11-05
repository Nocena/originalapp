import { useCallback, useEffect, useRef, useState } from 'react';
import { ChallengeCompletion } from '../types';
import { fetchUserSimilarChallengeCompletionsPaginate } from '../api';

export const useUserSimilarChallengeCompletions = (
  userLensAccountId: string,
  challengeIds: string[],
  initialLimit = 10
) => {
  const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);
  const [limit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadingRef = useRef(false);

  const fetchCompletions = useCallback(
    async (append = false) => {
      if (!userLensAccountId || loadingRef.current) return;

      try {
        setLoading(true);
        loadingRef.current = true;

        const data = await fetchUserSimilarChallengeCompletionsPaginate(
          userLensAccountId,
          challengeIds,
          limit,
          offset
        );

        if (data.length < limit) setHasMore(false);

        setCompletions((prev) => (append ? [...prev, ...data] : data));
      } catch (err: any) {
        console.error('Error fetching user completion completions:', err);
        setError(err);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [userLensAccountId, challengeIds, limit, offset]
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setOffset((prev) => prev + limit);
    }
  }, [hasMore, loading, limit]);

  useEffect(() => {
    fetchCompletions(offset > 0);
  }, [offset, fetchCompletions, challengeIds]);

  const refetch = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    setCompletions([]);
    fetchCompletions(false);
  }, [fetchCompletions]);

  return { completions, loading, error, hasMore, loadMore, refetch };
};
