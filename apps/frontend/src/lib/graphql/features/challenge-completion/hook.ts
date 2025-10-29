import { useEffect, useState, useCallback } from "react";
import { fetchAllUserChallengeCompletionsPaginate } from './api';
import { BasicCompletionType } from './types';

export const useUserChallengeCompletions = (
  userLensAccountId: string,
  initialLimit = 10
) => {
  const [completions, setCompletions] = useState<BasicCompletionType[]>([]);
  const [limit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch completions (paginated)
  const fetchCompletions = useCallback(
    async (append = false) => {
      if (!userLensAccountId || loading) return;

      try {
        setLoading(true);
        const data = await fetchAllUserChallengeCompletionsPaginate(
          userLensAccountId,
          limit,
          offset
        );

        if (data.length < limit) setHasMore(false);

        setCompletions((prev) => (append ? [...prev, ...data] : data));
      } catch (err: any) {
        console.error("Error fetching user challenge completions:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [userLensAccountId, limit, offset, loading]
  );

  // Load more (pagination)
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setOffset((prev) => prev + limit);
    }
  }, [hasMore, loading, limit]);

  // Fetch on mount and pagination change
  useEffect(() => {
    fetchCompletions(offset > 0);
  }, [offset, fetchCompletions]);

  return {
    completions,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => {
      setOffset(0);
      fetchCompletions(false);
    },
  };
};
