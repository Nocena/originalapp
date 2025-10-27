import {
  AccountDocument,
  AccountQuery, AccountQueryVariables,
  FollowingDocument,
  FollowingQuery,
  FollowingQueryVariables,
  PageSize,
} from '@nocena/indexer';
import { lensApolloClient } from '@pages/_app';

export async function fetchFollowingData(
  address: string
): Promise<FollowingQuery["following"]> {
  const { data } = await lensApolloClient.query<FollowingQuery, FollowingQueryVariables>({
    query: FollowingDocument,
    variables: {
      request: {
        pageSize: PageSize.Fifty,
        account: address
      }
    },
  });

  return data.following;
}

export async function getLensAccountByAddress(
  address: string
): Promise<AccountQuery> {
  const { data } = await lensApolloClient.query<AccountQuery, AccountQueryVariables>({
    query: AccountDocument,
    variables: {
      request: {
        address,
      }
    },
  });

  return data;
}