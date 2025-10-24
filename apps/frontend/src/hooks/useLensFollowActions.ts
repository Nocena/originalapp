import { useState, useCallback } from "react";
import { useApolloClient } from "@apollo/client";
import { AccountFragment, useFollowMutation, useUnfollowMutation } from '@nocena/indexer';
import useTransactionLifecycle from './useTransactionLifecycle';

export const useLensFollowActions = () => {
  const { cache } = useApolloClient();
  const handleTransactionLifecycle = useTransactionLifecycle();

  const [followeringAccount, setFolloweringAccount] = useState<AccountFragment | null>(null);

  const updateCache = useCallback(() => {
    if (!followeringAccount?.operations) return;

    cache.modify({
      id: cache.identify(followeringAccount.operations),
      fields: {
        isFollowedByMe: () => !followeringAccount.operations?.isFollowedByMe,
      },
    });
  }, [cache, followeringAccount]);

  const onError = (error: any) => {
    setFolloweringAccount(null);
  };

  const onCompleted = useCallback(() => {
    updateCache();
    setFolloweringAccount(null);
  }, [updateCache]);

  const [follow] = useFollowMutation({
    onCompleted: async ({ follow }) => {
      if (follow.__typename === "FollowResponse") return onCompleted();
      if (follow.__typename === "AccountFollowOperationValidationFailed")
        return onError?.({ message: follow.reason });

      return handleTransactionLifecycle({
        transactionData: follow,
        onCompleted,
        onError,
      });
    },
    onError,
  });

  const [unfollow] = useUnfollowMutation({
    onCompleted: async ({ unfollow }) => {
      if (unfollow.__typename === "UnfollowResponse") return onCompleted();
      if (unfollow.__typename === "AccountFollowOperationValidationFailed")
        return onError?.({ message: unfollow.reason });

      return handleTransactionLifecycle({
        transactionData: unfollow,
        onCompleted,
        onError,
      });
    },
    onError,
  });

  const handleFollow = useCallback(
    async (account: AccountFragment) => {
      setFolloweringAccount(account);
      await follow({ variables: { request: { account: account.address } } });
    },
    [follow]
  );

  const handleUnfollow = useCallback(
    async (account: AccountFragment) => {
      setFolloweringAccount(account);
      await unfollow({ variables: { request: { account: account.address } } });
    },
    [unfollow]
  );

  return {
    handleFollow,
    handleUnfollow,
    followeringAccount,
  };
};
