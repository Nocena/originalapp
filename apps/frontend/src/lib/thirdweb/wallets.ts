import { inAppWallet, createWallet } from 'thirdweb/wallets';

export const wallets = [
  inAppWallet({
    auth: {
      options: ['google', 'apple', 'facebook', 'discord', 'telegram', 'x', 'email', 'phone'],
    },
  }),
];
