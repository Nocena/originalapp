import {
  AccountDocument,
  AccountQuery,
  AccountQueryVariables,
  FollowingDocument,
  FollowingQuery,
  FollowingQueryVariables,
  PageSize,
} from '@nocena/indexer';
import { lensApolloClient } from '@pages/_app';
import { fetchAccountsBulk } from '@lens-protocol/client/actions';
import { lensPublicClient } from '../constants';
import { BasicCompletionType } from '../graphql/features/challenge-completion/types';

export async function fetchFollowingData(
  address: string,
): Promise<FollowingQuery['following']> {
  const { data } = await lensApolloClient.query<FollowingQuery, FollowingQueryVariables>({
    query: FollowingDocument,
    variables: {
      request: {
        pageSize: PageSize.Fifty,
        account: address,
      },
    },
  });

  return data.following;
}

export async function getLensAccountByAddress(
  address: string,
): Promise<AccountQuery> {
  const { data } = await lensApolloClient.query<AccountQuery, AccountQueryVariables>({
    query: AccountDocument,
    variables: {
      request: {
        address,
      },
    },
  });

  return data;
}

export async function getLensAccountsInAddresses(
  addresses: string[],
) {
  const result = await fetchAccountsBulk(
    lensPublicClient,
    {
      addresses: addresses
      ,
    });

  if (result.isErr()) {
    return []
  }

  return result.value
}

export async function addUserAccountToCompletions (
  completions: BasicCompletionType[]
) {
  const uniqueAddresses = Array.from(
    new Set(completions.map(completion => completion.userLensAccountId))
  );
  const lensAccounts = await getLensAccountsInAddresses(uniqueAddresses) || []
  completions.map(completion => {
    const { userLensAccountId } = completion
    completion.userAccount = lensAccounts.find(account => account.address === userLensAccountId)
  })

  return completions
}