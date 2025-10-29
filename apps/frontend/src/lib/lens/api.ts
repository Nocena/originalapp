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
import {
  BasicCompletionType,
  ChallengeCompletion,
} from '../graphql/features/challenge-completion/types';

export async function fetchFollowingData(address: string): Promise<FollowingQuery['following']> {
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

export async function getLensAccountByAddress(address: string): Promise<AccountQuery> {
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

export async function getLensAccountsInAddresses(addresses: string[]) {
  const result = await fetchAccountsBulk(lensPublicClient, {
    addresses: addresses,
  });

  if (result.isErr()) {
    return [];
  }

  return result.value;
}

export async function addUserAccountToCompletions(completions: ChallengeCompletion[]) {
  // Step 1: Collect all unique userLensAccountIds
  const allUserIds = new Set<string>();

  completions.forEach((completion) => {
    if (completion.userLensAccountId) {
      allUserIds.add(completion.userLensAccountId.toLowerCase());
    }
    completion.recentReactions?.forEach((reaction) => {
      if (reaction.userLensAccountId) {
        allUserIds.add(reaction.userLensAccountId.toLowerCase());
      }
    });
  });

  // Step 2: Fetch all Lens accounts at once
  const lensAccounts = (await getLensAccountsInAddresses(Array.from(allUserIds))) || [];

  // Create a lookup map for faster access
  const accountMap = new Map(
    lensAccounts.map((account) => [account.address.toLowerCase(), account])
  );

  // Step 3: Add userAccount to top-level and nested recentReactions
  completions.forEach((completion) => {
    completion.userAccount =
      accountMap.get(completion.userLensAccountId?.toLowerCase() || '') || undefined;

    completion.recentReactions?.forEach((reaction) => {
      reaction.userAccount =
        accountMap.get(reaction.userLensAccountId?.toLowerCase() || '') || undefined;
    });
  });

  return completions;
}
