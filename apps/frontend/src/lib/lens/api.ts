import { FollowingDocument, FollowingQuery, FollowingQueryVariables, PageSize } from '@nocena/indexer';
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