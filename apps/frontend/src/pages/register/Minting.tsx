import { useAccountQuery } from '@nocena/indexer';
import { useSignupStore } from '../../store/non-persisted/useSignupStore';
import ThematicContainer from '@components/ui/ThematicContainer';
import React from 'react';

interface MintingProps {
  registerWholeAccount: (lensAccountAddress: string) => void
}
const Minting = ({registerWholeAccount}: MintingProps) => {
  const { choosedUsername, setCurrentStep, setAccountAddress, transactionHash } = useSignupStore();

  useAccountQuery({
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data.account) {
        setAccountAddress(data.account.address);
        registerWholeAccount(data.account.address)
        // setCurrentStep(RegisterStep.WELCOME)
      }
    },
    pollInterval: 1500,
    skip: !transactionHash,
    variables: { request: { username: { localName: choosedUsername } } },
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
      <div className="mt-3 text-center text-sm text-gray-500 mb-8">
        This will take a few seconds to a few minutes. Please be patient.
      </div>
      <div className="w-16 h-16 border-4 border-nocenaPink/20 border-t-nocenaPink rounded-full animate-spin mx-auto mb-2" />
    </ThematicContainer>
  );
};

export default Minting;
