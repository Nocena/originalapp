import { useReadContract } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { formatEther, Abi } from 'viem';
import { client, flowTestnet } from '../lib/thirdweb';
import { CONTRACTS } from '../lib/constants';
import noceniteTokenArtifact from '../lib/contracts/nocenite.json';

const noceniteContract = getContract({
  client,
  chain: flowTestnet,
  address: CONTRACTS.Nocenite,
  abi: noceniteTokenArtifact.abi as Abi,
});

export const useNoceniteBalanceFormatted = (ownerAddress?: string) => {
  const { data, isLoading } = useReadContract({
    contract: noceniteContract,
    method: 'function balanceOf(address) view returns (uint256)',
    params: [ownerAddress!],
    queryOptions: {
      enabled: !!ownerAddress,
    },
  });

  const balance = data ? Number(formatEther(data as bigint)) : 0;

  return { balance, loading: isLoading };
};
