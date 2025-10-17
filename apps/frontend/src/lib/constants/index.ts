// Dual Token System - Flow EVM Testnet
export const FLOW_EVM_TESTNET_ID = 545;

export const CONTRACTS = {
  Nocenite: '0xA92C45C3d516f1cCe011BE92C81326962e5C1047',
  ChallengeRewards: '0xf9b4812a2160b4550045ae3DfDF797eC4d5C3336',
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
