// import type { Account as LensAccount } from '@nocena/indexer';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { signIn } from '../../store/persisted/useAuthStore';
import { HEY_APP, IS_MAINNET } from '@nocena/data/constants';
import { Errors } from '@nocena/data/errors';
import {
  type ChallengeRequest,
  useAccountsAvailableQuery,
  useAuthenticateMutation,
  useChallengeMutation,
} from '@nocena/indexer';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useActiveAccount } from 'thirdweb/react';
import { signMessage } from 'thirdweb/utils';
import SingleAccount from '../Account/SingleAccount';
import { Loader } from '@components/ui';
import AuthMessage from '@components/auth/AuthMessage';
import AccountNotFound from '@components/auth/AccountNotFound';
import { useUsersByWalletAndLensIds } from '../../lib/graphql/features/user/hook';
import type { CombinedUser, User } from '../../contexts/AuthContext';

const Login = () => {
  const [hasAccounts, setHasAccounts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loggingInAccountId, setLoggingInAccountId] = useState<null | string>(
    null,
  );
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

  const accounts = lastLogin
    ? [lastLogin, ...remainingAccounts]
    : remainingAccounts;

  const { users, loading: loadingDgraph, error: errorDgraph } = useUsersByWalletAndLensIds(thirdWebAccount?.address, accounts.map(account => account.address))

  const mergedUsers = users.map((user: User) => {
    const lensAccount = accounts.find(acc => acc.address === user.lensAccountId);
    return { ...user, lensAccount };
  }) as CombinedUser[];

  const handleSign = async (account: string) => {
    if (!thirdWebAccount)
      return;

    const isManager = allAccounts.some(
      ({ account: a, __typename }) =>
        __typename === 'AccountManaged' && a.address === account,
    );

    const meta = { app: IS_MAINNET ? HEY_APP : undefined, account };
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

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {errorChallenge || errorAuthenticate || errorDgraph ? (
          <ErrorMessage
            className="text-red-500"
            title={Errors.SomethingWentWrong}
            error={errorChallenge || errorAuthenticate || errorDgraph}
          />
        ) : null}
        {loading || loadingDgraph ? (
          <Card className="w-full dark:divide-gray-700" forceRounded>
            <Loader
              className="my-4"
              message="Loading accounts managed by you..."
              small
            />
          </Card>
        ) : mergedUsers.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, height: 0, overflow: 'hidden' },
                visible: {
                  opacity: 1,
                  height: 'auto',
                  transition: { duration: 0.2, ease: [0.075, 0.82, 0.165, 1] },
                },
              }}
            >
              <Card
                className="max-h-[50vh] w-full overflow-y-auto dark:divide-gray-700"
                forceRounded
              >
                <AuthMessage
                  description="Nocena uses this signature to verify that you're the owner of this address."
                  title="Please sign the message."
                />
                {mergedUsers.map(({lensAccount}, index) => (
                  <motion.div
                    key={lensAccount.address}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.1 },
                      },
                    }}
                    custom={index}
                    className="flex items-center justify-between p-3"
                    whileHover={{
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      transition: { duration: 0.2 },
                    }}
                  >
                    <SingleAccount
                      account={lensAccount}
                      showUserPreview={false}
                    />
                    <Button
                      disabled={
                        isSubmitting && loggingInAccountId === lensAccount.address
                      }
                      loading={
                        isSubmitting && loggingInAccountId === lensAccount.address
                      }
                      onClick={() => handleSign(lensAccount.address)}
                      outline
                    >
                      Use
                    </Button>
                  </motion.div>
                ))}
              </Card>
            </motion.div>
          </AnimatePresence>
        ) : (
          <AccountNotFound />
        )}
      </div>
    </div>
  );
};

export default Login;
