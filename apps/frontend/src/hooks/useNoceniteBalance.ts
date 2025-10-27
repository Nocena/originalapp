import { useReadContract } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { formatEther } from 'viem';
import { client, flowTestnet } from '../lib/thirdweb';
import { CONTRACTS } from '../lib/constants';
import noceniteTokenArtifact from '../lib/contracts/nocenite.json';

const noceniteContract = getContract({
  client,
  chain: flowTestnet,
  address: CONTRACTS.Nocenite,
  abi: noceniteTokenArtifact.abi,
});

export const useNoceniteBalanceFormatted = (ownerAddress?: string) => {
  const { data, isLoading } = useReadContract({
    contract: noceniteContract,
    method: 'balanceOf',
    params: ownerAddress ? [ownerAddress] : undefined,
  });

  const balance = data ? Number(formatEther(data as bigint)) : 0;

  return { balance, loading: isLoading };
};
