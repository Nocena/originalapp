// import type { Account as LensAccount } from '@nocena/indexer';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { signIn } from '../../store/persisted/useAuthStore';
import { IS_MAINNET, NOCENA_APP } from '@nocena/data/constants';
import { Errors } from '@nocena/data/errors';
import {
  AccountFragment,
  type ChallengeRequest,
  useAccountsAvailableQuery,
  useAuthenticateMutation,
  useChallengeMutation,
} from '@nocena/indexer';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useActiveAccount } from 'thirdweb/react';
import { signMessage } from 'thirdweb/utils';
import SingleAccount from '../Account/SingleAccount';
import { Loader } from '@components/ui';
import AuthMessage from '@components/auth/AuthMessage';
import AccountNotFound from '@components/auth/AccountNotFound';
import { useAvailableNocenaLensAccounts } from '../../lib/graphql/features/challenge-completion/hook/useAvailableNocenaLensAccounts';

const Login = () => {
  const [hasAccounts, setHasAccounts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loggingInAccountId, setLoggingInAccountId] = useState<null | string>(null);
  const onError = (error?: any) => {
    setIsSubmitting(false);
    setLoggingInAccountId(null);
    toast.error(error);
  };

  const thirdWebAccount = useActiveAccount();
  const [loadChallenge, { error: errorChallenge }] = useChallengeMutation({
    onError,
  });
  const [authenticate, { error: errorAuthenticate }] = useAuthenticateMutation({
    onError,
  });

  const { data, loading } = useAccountsAvailableQuery({
    onCompleted: (data) => {
      setHasAccounts(data?.accountsAvailable.items.length > 0);
    },
    skip: !thirdWebAccount?.address,
    variables: {
      accountsAvailableRequest: { managedBy: thirdWebAccount?.address },
      lastLoggedInAccountRequest: { address: thirdWebAccount?.address },
    },
  });

  const allAccounts = data?.accountsAvailable.items || [];
  const lastLogin = data?.lastLoggedInAccount;
  const remainingAccounts = lastLogin
    ? allAccounts
        .filter(({ account }) => account.address !== lastLogin.address)
        .map(({ account }) => account)
    : allAccounts.map(({ account }) => account);

  const accounts = useMemo(() => {
    if (lastLogin) return [lastLogin, ...remainingAccounts];
    return remainingAccounts;
  }, [lastLogin, remainingAccounts]);

  const { availableNocenaLensAccounts, loading: availableFiltering } =
    useAvailableNocenaLensAccounts(accounts);

  const handleSign = async (account: string) => {
    if (!thirdWebAccount) return;

    const isManager = allAccounts.some(
      ({ account: a, __typename }) => __typename === 'AccountManaged' && a.address === account
    );

    const meta = { app: IS_MAINNET ? NOCENA_APP : undefined, account };
    const request: ChallengeRequest = isManager
      ? { accountManager: { manager: thirdWebAccount?.address, ...meta } }
      : { accountOwner: { owner: thirdWebAccount?.address, ...meta } };

    try {
      setLoggingInAccountId(account || null);
      setIsSubmitting(true);
      // Get challenge
      const challenge = await loadChallenge({
        variables: { request },
      });

      if (!challenge?.data?.challenge?.text) {
        return toast.error(Errors.SomethingWentWrong);
      }

      // Get signature
      const signature = await signMessage({
        message: challenge?.data?.challenge?.text,
        account: thirdWebAccount,
      });

      // Auth account
      const auth = await authenticate({
        variables: { request: { id: challenge.data.challenge.id, signature } },
      });

      if (auth.data?.authenticate.__typename === 'AuthenticationTokens') {
        const accessToken = auth.data?.authenticate.accessToken;
        const refreshToken = auth.data?.authenticate.refreshToken;
        signIn({ accessToken, refreshToken });
        return location.reload();
      }

      return onError({ message: Errors.SomethingWentWrong });
    } catch {
      onError();
    }
  };

  useEffect(() => {
    if (availableNocenaLensAccounts.length > 0) {
      handleSign(availableNocenaLensAccounts[0].address);
    }
  }, [availableNocenaLensAccounts]);

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {errorChallenge || errorAuthenticate ? (
          <ErrorMessage
            className="text-red-500"
            title={Errors.SomethingWentWrong}
            error={errorChallenge || errorAuthenticate}
          />
        ) : null}
        {loading || availableFiltering || isSubmitting ? (
          <Card className="w-full dark:divide-gray-700" forceRounded>
            <Loader className="my-4" message="Loading accounts managed by you..." small />
          </Card>
        ) : (
          availableNocenaLensAccounts.length <= 0 && <AccountNotFound />
        )}
      </div>
    </div>
  );
};

export default Login;
