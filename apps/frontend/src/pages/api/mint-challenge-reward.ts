import { NextApiRequest, NextApiResponse } from 'next';
import {
  createWalletClient,
  http,
  keccak256,
  encodeAbiParameters,
  defineChain,
  parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACTS } from '../../lib/constants';
import challengeRewardsArtifact from '../../lib/contracts/challengeRewards.json';

// Define Flow EVM Testnet for viem
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userAddress,
      challengeFrequency,
      challengeType,
      challengeId,
      creatorAddress,
      recipientReward,
      creatorReward,
      ipfsHash,
    } = req.body;

    // Validate required parameters based on challenge type
    if (!userAddress || !ipfsHash) {
      return res.status(400).json({ error: 'Missing required parameters: userAddress, ipfsHash' });
    }

    if (challengeType === 'PRIVATE') {
      if (!challengeId || !creatorAddress || !recipientReward || !creatorReward) {
        return res.status(400).json({
          error:
            'Missing required parameters for private challenge: challengeId, creatorAddress, recipientReward, creatorReward',
        });
      }
    } else if (challengeType === 'PUBLIC') {
      if (!recipientReward) {
        return res.status(400).json({
          error: 'Missing required parameter for public challenge: recipientReward',
        });
      }
    } else if (!challengeFrequency) {
      return res.status(400).json({ error: 'Missing required parameter: challengeFrequency' });
    }

    // Get relayer private key from environment
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      return res.status(500).json({ error: 'Relayer private key not configured' });
    }

    // Ensure private key has 0x prefix
    const formattedPrivateKey = relayerPrivateKey.startsWith('0x')
      ? relayerPrivateKey
      : `0x${relayerPrivateKey}`;

    // Create relayer account and wallet client
    const relayerAccount = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account: relayerAccount,
      chain: flowTestnet,
      transport: http(),
    });

    console.log('🔍 Relayer address:', relayerAccount.address);

    if (challengeType === 'PRIVATE') {
      // Private challenge - single transaction with dual minting
      if (!challengeId || !creatorAddress || !recipientReward) {
        return res.status(400).json({
          error:
            'Missing required parameters for private challenge: challengeId, creatorAddress, recipientReward',
        });
      }

      // Create message hash for dual minting
      const messageHash = keccak256(
        encodeAbiParameters(
          [
            { name: 'recipient', type: 'address' },
            { name: 'challengeType', type: 'string' },
            { name: 'ipfsHash', type: 'string' },
          ],
          [userAddress as `0x${string}`, 'private', ipfsHash]
        )
      );

      const signature = await walletClient.signMessage({
        message: { raw: messageHash },
      });

      console.log('🔄 Attempting dual private challenge transaction...');
      const txHash = await walletClient.writeContract({
        address: CONTRACTS.ChallengeRewards as `0x${string}`,
        abi: challengeRewardsArtifact.abi,
        functionName: 'completePrivateChallenge',
        args: [
          userAddress,
          creatorAddress,
          parseEther(recipientReward.toString()),
          ipfsHash,
          signature,
        ],
      });

      console.log('✅ Private challenge dual minting completed:', txHash);
      console.log('💰 Recipient reward:', recipientReward, 'NCT');
      console.log(
        '💰 Creator reward:',
        Math.floor(recipientReward * 0.1),
        'NCT (auto-calculated 10%)'
      );

      return res.status(200).json({
        success: true,
        txHash,
        message: `Private challenge completed! +${recipientReward} NCT to recipient, +${Math.floor(recipientReward * 0.1)} NCT to creator`,
      });
    } else if (challengeType === 'PUBLIC') {
      // Public challenge - variable reward amount
      if (!recipientReward) {
        return res.status(400).json({
          error: 'Missing required parameter for public challenge: recipientReward',
        });
      }

      // Create message hash for public challenge
      const messageHash = keccak256(
        encodeAbiParameters(
          [
            { name: 'user', type: 'address' },
            { name: 'challengeType', type: 'string' },
            { name: 'ipfsHash', type: 'string' },
          ],
          [userAddress as `0x${string}`, 'public', ipfsHash]
        )
      );

      const signature = await walletClient.signMessage({
        message: { raw: messageHash },
      });

      console.log('🔄 Attempting public challenge transaction...');
      const txHash = await walletClient.writeContract({
        address: CONTRACTS.ChallengeRewards as `0x${string}`,
        abi: challengeRewardsArtifact.abi,
        functionName: 'completePublicChallenge',
        args: [userAddress, parseEther(recipientReward.toString()), ipfsHash, signature],
      });

      console.log('✅ Public challenge completed:', txHash);
      console.log('💰 Reward:', recipientReward, 'NCT');

      return res.status(200).json({
        success: true,
        txHash,
        message: `Public challenge completed! +${recipientReward} NCT earned`,
      });
    } else {
      // AI challenge function (existing logic)
      const functionName = `complete${challengeFrequency.charAt(0).toUpperCase() + challengeFrequency.slice(1)}Challenge`;

      // Create message hash for AI challenge
      const messageHash = keccak256(
        encodeAbiParameters(
          [
            { name: 'user', type: 'address' },
            { name: 'challengeType', type: 'string' },
            { name: 'ipfsHash', type: 'string' },
          ],
          [userAddress as `0x${string}`, challengeFrequency, ipfsHash]
        )
      );

      const contractArgs = [userAddress, ipfsHash];

      // Sign the message hash
      const signature = await walletClient.signMessage({
        message: { raw: messageHash },
      });

      // Call the contract function with dynamic arguments
      const txHash = await walletClient.writeContract({
        address: CONTRACTS.ChallengeRewards as `0x${string}`,
        abi: challengeRewardsArtifact.abi,
        functionName,
        args: [...contractArgs, signature],
      });

      return res.status(200).json({
        success: true,
        txHash,
        functionName,
        message: `${challengeFrequency} challenge reward minted successfully`,
      });
    }
  } catch (error) {
    console.error('Relayer error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
