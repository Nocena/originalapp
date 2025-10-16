import { useActiveAccount } from 'thirdweb/react';
import { formatEther } from 'viem';
import { useNoceniteBalance } from './useNocenite';

export function useNoceniteToken() {
  const account = useActiveAccount();
  const nctBalance = useNoceniteBalance(account?.address);

  return {
    raw: (nctBalance.data as bigint) || 0n,
    formatted: formatEther((nctBalance.data as bigint) || 0n),
    isLoading: nctBalance.isLoading,
  };
}
