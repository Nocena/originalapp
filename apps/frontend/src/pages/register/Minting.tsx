import { useAccountQuery } from '@nocena/indexer';
import { useSignupStore } from '../../store/non-persisted/useSignupStore';
import ThematicContainer from '@components/ui/ThematicContainer';
import React from 'react';

const Minting = () => {
  const { choosedUsername, setAccountAddress, setScreen, transactionHash } =
    useSignupStore();

  useAccountQuery({
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data.account) {
        setAccountAddress(data.account.address);
        setScreen("success");
      }
    },
    pollInterval: 1500,
    skip: !transactionHash,
    variables: { request: { username: { localName: choosedUsername } } }
  });

  return (
    <ThematicContainer
      color="nocenaPink"
      glassmorphic={true}
      asButton={false}
      rounded="2xl"
      className="p-8 text-center"
    >
      <h4>We are preparing your account!</h4>
      <div className="mt-3 text-center font-semibold text-gray-500 dark:text-gray-200">
        This will take a few seconds to a few minutes. Please be patient.
      </div>
      <div
        className="w-16 h-16 border-4 border-nocenaPink/20 border-t-nocenaPink rounded-full animate-spin mx-auto mb-6" />
    </ThematicContainer>
  );
};

export default Minting;
