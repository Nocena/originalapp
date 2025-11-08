import {
  createWalletClient,
  http,
  keccak256,
  encodeAbiParameters,
  defineChain,
  parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACTS } from '../constants';
import socialRewardsABI from './socialRewards.json';

const flowTestnet = defineChain({
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
});

export class SocialRewardsService {
  private walletClient: any;

  constructor(relayerPrivateKey: string) {
    const formattedPrivateKey = relayerPrivateKey.startsWith('0x')
      ? relayerPrivateKey
      : `0x${relayerPrivateKey}`;

    const relayerAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    this.walletClient = createWalletClient({
      account: relayerAccount,
      chain: flowTestnet,
      transport: http(),
    });
  }

  async processLike(userAddress: string, completionId: string): Promise<string> {
    const amount = parseEther('2'); // 2 NCT for likes
    const interactionId = keccak256(
      encodeAbiParameters(
        [{ name: 'data', type: 'string' }],
        [`${userAddress}_like_${completionId}_${Date.now()}`]
      )
    );

    const messageHash = keccak256(
      encodeAbiParameters(
        [
          { name: 'users', type: 'address[]' },
          { name: 'amounts', type: 'uint256[]' },
          { name: 'interactionIds', type: 'bytes32[]' },
        ],
        [[userAddress as `0x${string}`], [amount], [interactionId]]
      )
    );

    const signature = await this.walletClient.signMessage({
      message: { raw: messageHash },
    });

    const txHash = await this.walletClient.writeContract({
      address: CONTRACTS.SocialRewards as `0x${string}`,
      abi: socialRewardsABI.abi,
      functionName: 'batchRewardSocialInteractions',
      args: [[userAddress], [amount], [interactionId], signature],
    });

    return txHash;
  }

  async processFollow(userAddress: string, followedUserId: string): Promise<string> {
    const amount = parseEther('10'); // 10 NCT for follows (max allowed)
    const interactionId = keccak256(
      encodeAbiParameters(
        [{ name: 'data', type: 'string' }],
        [`${userAddress}_follow_${followedUserId}_${Date.now()}`]
      )
    );

    const messageHash = keccak256(
      encodeAbiParameters(
        [
          { name: 'users', type: 'address[]' },
          { name: 'amounts', type: 'uint256[]' },
          { name: 'interactionIds', type: 'bytes32[]' },
        ],
        [[userAddress as `0x${string}`], [amount], [interactionId]]
      )
    );

    const signature = await this.walletClient.signMessage({
      message: { raw: messageHash },
    });

    const txHash = await this.walletClient.writeContract({
      address: CONTRACTS.SocialRewards as `0x${string}`,
      abi: socialRewardsABI.abi,
      functionName: 'batchRewardSocialInteractions',
      args: [[userAddress], [amount], [interactionId], signature],
    });

    return txHash;
  }
}
