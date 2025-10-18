// Dual Token System - Flow EVM Testnet
export const FLOW_EVM_TESTNET_ID = 545;

export const CONTRACTS = {
  Nocenite: '0x4d25c4EB1E0358F2FfF2c170865a37BEe172696B',
  ChallengeRewards: '0xED268e5Cf8D717c3737f4ac156DCD518548CEe0D',
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
export const lensPublicClient = {} as any;

// WalletConnect Configuration
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
