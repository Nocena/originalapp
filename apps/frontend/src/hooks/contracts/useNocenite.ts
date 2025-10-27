import { useReadContract } from 'thirdweb/react';
import { CONTRACTS } from '../../lib/constants';
import { getContract } from 'thirdweb';
import { client, flowTestnet } from '../../lib/thirdweb';
import noceniteArtifact from '../../lib/contracts/nocenite.json';

const noceniteContract = getContract({
  client,
  chain: flowTestnet,
  address: CONTRACTS.Nocenite,
  abi: noceniteArtifact.abi,
});

export function useNoceniteBalance(address?: string) {
  return useReadContract({
    contract: noceniteContract,
    method: 'balanceOf',
    params: address ? [address] : undefined,
  });
}

export function useNoceniteInfo() {
  const name = useReadContract({
    contract: noceniteContract,
    method: 'name',
  });

  const symbol = useReadContract({
    contract: noceniteContract,
    method: 'symbol',
  });

  const totalSupply = useReadContract({
    contract: noceniteContract,
    method: 'totalSupply',
  });

  return { name, symbol, totalSupply };
}

export function useIsRewardMinter(address?: string) {
  return useReadContract({
    contract: noceniteContract,
    method: 'isRewardMinter',
    params: address ? [address] : undefined,
  });
}
