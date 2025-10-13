import { inAppWallet, createWallet } from 'thirdweb/wallets';

export const wallets = [
  inAppWallet({
    auth: {
      options: ['google', 'apple', 'facebook', 'discord', 'telegram', 'x', 'email', 'phone'],
    },
  }),
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  createWallet('walletConnect'),
  createWallet('com.trustwallet.app'),
];
