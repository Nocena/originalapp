import { CHAIN } from '@nocena/data/constants';
import { useConnections, useSwitchChain } from 'wagmi';

const useHandleWrongNetwork = () => {
  return async () => {};
  /*
  const activeConnection = useConnections();
  const { switchChainAsync } = useSwitchChain();

  const isConnected = () => activeConnection[0] !== undefined;
  const isWrongNetwork = () => activeConnection[0]?.chainId !== CHAIN.id;

  return async () => {
    if (!isConnected()) {
      console.warn("No active connection found.");
      return;
    }

    if (isWrongNetwork()) {
      try {
        await switchChainAsync({ chainId: CHAIN.id });
      } catch (error) {
        console.error("Failed to switch chains:", error);
      }
    }
  };
*/
};

export default useHandleWrongNetwork;
