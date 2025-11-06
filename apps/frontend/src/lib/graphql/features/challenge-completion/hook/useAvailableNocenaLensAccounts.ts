import { useEffect, useMemo, useState } from 'react';
import { getUsersWithCompletions } from '../api';
import { AccountFragment } from '@nocena/indexer';

interface UseUsersWithCompletionsResult {
  availableNocenaLensAccounts: AccountFragment[];
  loading: boolean;
  error?: Error | null;
}

/**
 * Custom React hook to fetch Lens account IDs that have completed challenges.
 *
 * @param accounts - Array of Lens accounts to check.
 */
export function useAvailableNocenaLensAccounts(
  accounts: AccountFragment[]
): UseUsersWithCompletionsResult {
  const [filteredAccounts, setFilteredAccounts] = useState<AccountFragment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const userLensAccountIds = useMemo(() => accounts.map((a) => a.address), [accounts]);

  useEffect(() => {
    if (!userLensAccountIds?.length) return;

    let cancelled = false;
    setLoading(true);

    getUsersWithCompletions(userLensAccountIds)
      .then((result) => {
        if (!cancelled) {
          const filteredOnes = accounts.filter((account) => result.includes(account.address));
          setFilteredAccounts(filteredOnes.length <= 0 ? accounts : filteredOnes.slice(0, 1));
        }
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
  }, [JSON.stringify(userLensAccountIds)]);

  return { availableNocenaLensAccounts: filteredAccounts, loading, error };
}
