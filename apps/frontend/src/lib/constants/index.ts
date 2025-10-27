// Dual Token System - Flow EVM Testnet
import { mainnet, PublicClient } from '@lens-protocol/client';

export const FLOW_EVM_TESTNET_ID = 545;

export const CONTRACTS = {
  Nocenite: '0x70dbD83175A30f501Db20Eec6d7Fa53Beb0918C9',
  ChallengeRewards: '0x494dF496D38b4074971eB4730f8c3ce337115C03',
} as const;

// Challenge reward amounts (in tokens, not wei)
export const CHALLENGE_REWARDS = {
  DAILY: 100,
  WEEKLY: 500,
  MONTHLY: 2500,
} as const;

// Blockchain configuration
export const FLOW_TESTNET_CONFIG = {
  id: 545,
  name: 'Flow EVM Testnet',
  nativeCurrency: {
    name: 'Flow',
    symbol: 'FLOW',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flow Diver',
      url: 'https://testnet.flowdiver.io',
    },
  },
} as const;

// Lens Protocol Configuration (placeholders)
export const APP_ADDRESS = process.env.NEXT_PUBLIC_LENS_APP_ADDRESS as `0x${string}`;

const storage = typeof window !== 'undefined' ? window.localStorage : undefined;
export const lensPublicClient = PublicClient.create({
  environment: mainnet,
  storage: storage,
});
// WalletConnect Configuration
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
