// lib/thirdweb.ts
import { createThirdwebClient, defineChain } from 'thirdweb';

// Create the client with your Client ID and Secret Key
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
  secretKey: process.env.THIRDWEB_SECRET_KEY, // Add this for server-side operations
});

// Define Flow EVM Testnet chain
export const flowTestnet = defineChain({
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: {
    name: 'Flow',
    symbol: 'FLOW',
    decimals: 18,
  },
  rpc: 'https://testnet.evm.nodes.onflow.org',
  blockExplorers: [
    {
      name: 'Flow Diver',
      url: 'https://testnet.flowdiver.io',
    },
  ],
});

// Define the chains you want to use
export const chain = flowTestnet;
export const flowChain = flowTestnet;
