import selfFundedTransactionData from '../helpers/selfFundedTransactionData';
import sponsoredTransactionData from '../helpers/sponsoredTransactionData';
import { Errors } from '@nocena/data/errors';
import { sendEip712Transaction, sendTransaction } from 'viem/zksync';
import useHandleWrongNetwork from './useHandleWrongNetwork';
import { viemAdapter } from 'thirdweb/adapters/viem';
import { CHAIN } from '@nocena/data/constants';
import { useActiveWallet } from 'thirdweb/react';
import { useMemo } from 'react';
import { client } from '../lib/thirdweb';

const useTransactionLifecycle = () => {
  const wallet = useActiveWallet();
  const walletClient = useMemo(() => {
    if (!wallet) return null;

    return viemAdapter.walletClient.toViem({
      // @ts-ignore
      account: wallet.getAccount(),
      client: client,
      // @ts-ignore
      chain: CHAIN,
    });
  }, [wallet]);

  const handleWrongNetwork = useHandleWrongNetwork();

  const handleSponsoredTransaction = async (
    transactionData: any,
    onCompleted: (hash: string) => void
  ) => {
    await handleWrongNetwork();
    if (!walletClient) return;
    return onCompleted(
      await sendEip712Transaction(walletClient, {
        account: walletClient.account,
        ...sponsoredTransactionData(transactionData.raw),
      })
    );
  };

  const handleSelfFundedTransaction = async (
    transactionData: any,
    onCompleted: (hash: string) => void
  ) => {
    await handleWrongNetwork();
    if (!walletClient) return;
    return onCompleted(
      await sendTransaction(walletClient, {
        account: walletClient.account,
        ...selfFundedTransactionData(transactionData.raw),
      })
    );
  };

  const handleTransactionLifecycle = async ({
    transactionData,
    onCompleted,
    onError,
  }: {
    transactionData: any;
    onCompleted: (hash: string) => void;
    onError: (error: any) => void;
  }) => {
    try {
      switch (transactionData.__typename) {
        case 'SponsoredTransactionRequest':
          return await handleSponsoredTransaction(transactionData, onCompleted);
        case 'SelfFundedTransactionRequest':
          return await handleSelfFundedTransaction(transactionData, onCompleted);
        case 'TransactionWillFail':
          return onError({ message: transactionData.reason });
        default:
          throw onError({ message: Errors.SomethingWentWrong });
      }
    } catch (error) {
      return onError(error);
    }
  };

  return handleTransactionLifecycle;
};

export default useTransactionLifecycle;
