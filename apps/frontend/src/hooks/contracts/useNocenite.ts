import { useReadContract } from 'thirdweb/react';
import { CONTRACTS } from '../../lib/constants';
import { getContract } from 'thirdweb';
import { client, flowTestnet } from '../../lib/thirdweb';
import { defineChain } from 'thirdweb/chains';

const noceniteContract = getContract({
  client,
  chain: defineChain(flowTestnet),
  address: CONTRACTS.Nocenite,
});

export function useNoceniteBalance(address?: string) {
  return useReadContract({
    contract: noceniteContract,
    method: 'function balanceOf(address) view returns (uint256)',
    params: [address!],
    queryOptions: {
      enabled: !!address,
    },
  });
}

export function useNoceniteInfo() {
  const name = useReadContract({
    contract: noceniteContract,
    method: 'function name() view returns (string)',
  });

  const symbol = useReadContract({
    contract: noceniteContract,
    method: 'function symbol() view returns (string)',
  });

  const totalSupply = useReadContract({
    contract: noceniteContract,
    method: 'function totalSupply() view returns (uint256)',
  });

  return { name, symbol, totalSupply };
}

export function useIsRewardMinter(address?: string) {
  return useReadContract({
    contract: noceniteContract,
    method: 'function isRewardMinter(address) view returns (bool)',
    params: [address!],
    queryOptions: {
      enabled: !!address,
    },
  });
}
