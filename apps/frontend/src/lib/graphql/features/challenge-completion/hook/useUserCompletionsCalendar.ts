import { useEffect, useState } from 'react';
import { UserCompletionsCalendar } from '../types';
import { fetchUserCompletionsForCalendar } from '../api';

export function useUserCompletionsCalendar(userLensAccountId?: string) {
  const [data, setData] = useState<UserCompletionsCalendar | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!userLensAccountId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchUserCompletionsForCalendar({ userLensAccountId })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userLensAccountId]);

  return { data, loading, error };
}
