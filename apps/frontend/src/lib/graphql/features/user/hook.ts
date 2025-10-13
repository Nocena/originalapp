import { useQuery } from '@apollo/client';
import { GET_USERS_BY_WALLET_AND_LENS_ACCOUNTS } from './queries';
import { normalizeWallet } from '../../utils';
import graphqlClient from '../../client';

export const useUsersByWalletAndLensIds = (
  walletAddress: string | undefined,
  lensIds: string[]
) => {
  const normalizedWallet = walletAddress ? normalizeWallet(walletAddress) : '';
  const { data, loading, error } = useQuery(GET_USERS_BY_WALLET_AND_LENS_ACCOUNTS, {
    client: graphqlClient,
    variables: { walletAddress, normalizedWallet, lensIds },
    skip: !walletAddress || !lensIds?.length,
  });

  return {
    users: data?.queryUser ?? [],
    loading,
    error,
  };
};
