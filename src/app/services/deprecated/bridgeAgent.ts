import { ethers } from 'ethers';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';
import { SourceChain } from './universalBridgeService';

// Define Mantle as a SourceChain for type safety
// This approach is safer than modifying the original enum
export const MANTLE_CHAIN = 'mantle' as SourceChain;

// ABI for the destination bridge contract
const destinationABI = [
  "function mintWrapped(address recipient, uint256 amount, uint64 nonce, bytes memory vaa) external"
];

// Define types for chain configuration
interface EVMChainConfig {
  rpcUrl: string;
  chainId: number;
}

interface SolanaChainConfig {
  rpcUrl: string;
}

type ChainConfig = EVMChainConfig | SolanaChainConfig;

// Configuration for different chains
const chainConfig: Record<string, ChainConfig> = {
  [SourceChain.ETHEREUM]: {
    rpcUrl: process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
    chainId: 1,
  },
  [SourceChain.BINANCE]: {
    rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
    chainId: 56,
  },
  [SourceChain.POLYGON]: {
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com',
    chainId: 137,
  },
  [SourceChain.AVALANCHE]: {
    rpcUrl: process.env.NEXT_PUBLIC_AVAX_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
  },
  [SourceChain.ARBITRUM]: {
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
  },
  [SourceChain.OPTIMISM]: {
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    chainId: 10,
  },
  [SourceChain.SOLANA]: {
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  },
  [SourceChain.BASE]: {
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    chainId: 8453,
  },
  'mantle': {
    rpcUrl: process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz',
    chainId: 5000,
  }
};

// Initialize the LLM model for intent processing
const model = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  temperature: 0.2,
});

// Create a prompt template for parsing bridge commands
const bridgeCommandPrompt = PromptTemplate.fromTemplate(`
  Extract parameters from this user bridge command as JSON with keys: 
  token, amount, sourceChain, destinationChain.
  
  Command: {input}
  
  Ensure the response is only valid JSON without any additional text.
`);

const bridgeCommandChain = RunnableSequence.from([
  {
    input: (input: { command: string }) => input.command,
  },
  bridgeCommandPrompt,
  model,
  new StringOutputParser(),
]);

/**
 * Dummy function to fetch VAA (Verified Action Approval) from Wormhole
 * In production, replace with actual API call to Wormhole's VAA service
 */
async function fetchVAA(nonce: number): Promise<Uint8Array> {
  console.log('Fetching VAA for nonce:', nonce);
  // For demo, return a dummy VAA
  return ethers.utils.arrayify('0x1234abcd');
}

/**
 * Parses a natural language bridge command using LangChain
 */
export async function parseBridgeCommand(command: string) {
  try {
    const result = await bridgeCommandChain.invoke({ command });
    console.log('LLM parsed result:', result);
    return JSON.parse(result);
  } catch (error) {
    console.error('Error parsing bridge command:', error);
    throw new Error('Failed to parse your request. Please try again with a clearer instruction.');
  }
}

/**
 * Initiates a token bridge from source chain to Mantle
 */
export async function bridgeTokenToMantle(
  sourceChain: SourceChain,
  token: string,
  amount: string,
  recipientAddress: string
) {
  try {
    // Generate a unique nonce for this transaction
    const nonce = Math.floor(Math.random() * 1000000);
    
    console.log(`Initiating bridge: ${amount} ${token} from ${sourceChain} to Mantle`);
    
    // In a real implementation, this would initiate the lock transaction on the source chain
    console.log('Simulating lock transaction on source chain...');
    
    // Simulate waiting for source chain confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fetch the VAA after source chain confirmation
    const vaa = await fetchVAA(nonce);
    
    // In a real implementation, this would call the smart contract on Mantle
    console.log('Simulating mint transaction on Mantle...');
    console.log('Transaction parameters:', {
      recipient: recipientAddress,
      amount: ethers.utils.parseUnits(amount, 6).toString(), // Assuming 6 decimals
      nonce,
      vaaLength: vaa.length
    });
    
    // Simulate waiting for destination chain confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return success with transaction details
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).substring(2, 42),
      sourceChain,
      destinationChain: 'mantle',
      token,
      amount,
      recipientAddress,
      nonce
    };
  } catch (error) {
    console.error('Error in bridge process:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// For browser environments, create a provider based on window.ethereum
export function getWeb3Provider(chain: SourceChain): ethers.providers.JsonRpcProvider | null {
  try {
    if (typeof window !== 'undefined') {
      const config = chainConfig[chain];
      if (!config) return null;
      
      return new ethers.providers.JsonRpcProvider(config.rpcUrl);
    }
    return null;
  } catch (error) {
    console.error('Error creating Web3 provider:', error);
    return null;
  }
}

// Connect to a wallet (in browser environment)
export async function connectWallet(chain: SourceChain): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && 'ethereum' in window) {
      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      // Switch to the correct network if needed
      const config = chainConfig[chain];
      if (config && 'chainId' in config) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + config.chainId.toString(16) }],
          });
        } catch (switchError: any) {
          // Chain doesn't exist in wallet, would need to add it
          console.error('Error switching chain:', switchError);
        }
      }
      
      return accounts[0];
    }
    return null;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return null;
  }
} 