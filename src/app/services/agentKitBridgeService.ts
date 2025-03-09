import OpenAI from 'openai';
import { SourceChain } from './universalBridgeService';

// Check if AI features are enabled
const AI_FEATURES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === 'true';
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const hasValidApiKey = !!API_KEY && API_KEY.length > 0 && !API_KEY.includes('your-api-key');
const canUseOpenAI = AI_FEATURES_ENABLED && hasValidApiKey;

// Initialize OpenAI only if we have a valid API key
const openai = canUseOpenAI ? new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // Allow client-side usage
}) : null;

// Log initialization status
console.log(`[AgentKit] AI Features: ${AI_FEATURES_ENABLED ? 'Enabled' : 'Disabled'}`);
console.log(`[AgentKit] OpenAI Client: ${openai ? 'Initialized' : 'Not Available'}`);

// AgentKit Bridge Types
export interface BridgeInstruction {
  sourceChain: SourceChain;
  token: string;
  amount: number;
  destinationChain: 'mantle';
  userAddress: string;
}

export interface BridgeResult {
  status: 'initiated' | 'completed' | 'failed';
  transactionHash?: string;
  error?: string;
  estimatedTime?: number; // in seconds
  fees?: {
    sourceChainGas: string;
    destChainGas: string;
    bridgeFee: string;
  };
}

// Robust local NLP processor for bridging commands when API is unavailable
function localNLPProcessor(message: string): Partial<BridgeInstruction> | null {
  const instruction: Partial<BridgeInstruction> = {
    destinationChain: 'mantle'
  };
  
  // Extract source chain
  const sourceChainMatches = message.match(/from\s+(\w+)|on\s+(\w+)|in\s+(\w+)/i);
  if (sourceChainMatches) {
    const sourceChain = (sourceChainMatches[1] || sourceChainMatches[2] || sourceChainMatches[3])?.toLowerCase();
    // Map to valid enum
    const chainMap: Record<string, SourceChain> = {
      'ethereum': SourceChain.ETHEREUM,
      'eth': SourceChain.ETHEREUM,
      'polygon': SourceChain.POLYGON,
      'matic': SourceChain.POLYGON,
      'binance': SourceChain.BINANCE,
      'bnb': SourceChain.BINANCE,
      'avalanche': SourceChain.AVALANCHE,
      'avax': SourceChain.AVALANCHE,
      'arbitrum': SourceChain.ARBITRUM,
      'arb': SourceChain.ARBITRUM,
      'optimism': SourceChain.OPTIMISM,
      'op': SourceChain.OPTIMISM,
      'solana': SourceChain.SOLANA,
      'sol': SourceChain.SOLANA,
      'base': SourceChain.BASE
    };
    
    if (sourceChain && chainMap[sourceChain]) {
      instruction.sourceChain = chainMap[sourceChain];
    }
  }
  
  // Extract token
  const tokenMatches = message.match(/bridge\s+([0-9.]+)\s+(\w+)|send\s+([0-9.]+)\s+(\w+)|transfer\s+([0-9.]+)\s+(\w+)/i);
  if (tokenMatches) {
    const amount = parseFloat(tokenMatches[1] || tokenMatches[3] || tokenMatches[5]);
    const token = (tokenMatches[2] || tokenMatches[4] || tokenMatches[6])?.toUpperCase();
    
    if (!isNaN(amount) && token) {
      instruction.amount = amount;
      instruction.token = token;
    }
  }
  
  // Return null if we couldn't extract essential information
  if (!instruction.sourceChain || !instruction.token || !instruction.amount) {
    return null;
  }
  
  return instruction;
}

/**
 * Process a natural language bridge instruction using LLM
 * @param message User's natural language message about bridging
 * @returns Structured bridge instruction or null if unable to parse
 */
export async function processNaturalLanguageBridge(message: string): Promise<Partial<BridgeInstruction> | null> {
  try {
    if (!canUseOpenAI || !openai) {
      // Fall back to local processing if OpenAI is not available
      return localNLPProcessor(message);
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.1, // Use low temperature for more consistent parsing
      messages: [
        {
          role: 'system',
          content: `You are a helpful bridge agent that extracts structured information from natural language instructions.
          Extract the following information from the user's message about bridging tokens to Mantle:
          1. Source chain (e.g., Ethereum, Polygon, Binance, etc.)
          2. Token symbol (e.g., ETH, USDC, WBTC, etc.)
          3. Amount to bridge
          
          Assume Mantle is always the destination chain. Return the information in a JSON format with the keys:
          { "sourceChain": string, "token": string, "amount": number }`
        },
        { role: 'user', content: message }
      ]
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    try {
      // Try to parse the JSON response
      const jsonMatch = content.match(/\{.*\}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Map source chain string to enum
        const chainMap: Record<string, SourceChain> = {
          'ethereum': SourceChain.ETHEREUM,
          'eth': SourceChain.ETHEREUM,
          'polygon': SourceChain.POLYGON,
          'matic': SourceChain.POLYGON,
          'binance': SourceChain.BINANCE,
          'bnb': SourceChain.BINANCE,
          'avalanche': SourceChain.AVALANCHE,
          'avax': SourceChain.AVALANCHE,
          'arbitrum': SourceChain.ARBITRUM,
          'arb': SourceChain.ARBITRUM,
          'optimism': SourceChain.OPTIMISM,
          'op': SourceChain.OPTIMISM,
          'solana': SourceChain.SOLANA,
          'sol': SourceChain.SOLANA,
          'base': SourceChain.BASE
        };
        
        const normalizedSourceChain = parsed.sourceChain?.toLowerCase();
        const sourceChain = chainMap[normalizedSourceChain];
        
        return {
          sourceChain: sourceChain,
          token: parsed.token?.toUpperCase(),
          amount: Number(parsed.amount),
          destinationChain: 'mantle'
        };
      }
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      // Fall back to local processing if JSON parsing fails
      return localNLPProcessor(message);
    }
    
    // If we couldn't extract the information using the LLM, try local processing
    return localNLPProcessor(message);
  } catch (error) {
    console.error('Error processing natural language bridge instruction:', error);
    // Fall back to local processing in case of error
    return localNLPProcessor(message);
  }
}

/**
 * Estimate bridge transaction details
 * @param instruction Bridge instruction
 * @returns Detailed information about the bridge transaction
 */
export async function estimateBridgeTransaction(instruction: Partial<BridgeInstruction>): Promise<{
  estimatedTime: number;
  fees: {
    sourceChainGas: string;
    destChainGas: string;
    bridgeFee: string;
  };
  totalCost: string;
}> {
  // In a real implementation, this would call Wormhole's API to get actual estimates
  // For now, we'll return simulated values
  const chainGasMap: Record<SourceChain, number> = {
    [SourceChain.ETHEREUM]: 0.004,
    [SourceChain.POLYGON]: 0.001,
    [SourceChain.BINANCE]: 0.0005,
    [SourceChain.AVALANCHE]: 0.001,
    [SourceChain.ARBITRUM]: 0.0003,
    [SourceChain.OPTIMISM]: 0.0003,
    [SourceChain.SOLANA]: 0.00001,
    [SourceChain.BASE]: 0.0002,
    [SourceChain.MANTLE]: 0.0001
  };
  
  const sourceChainGas = instruction.sourceChain ? chainGasMap[instruction.sourceChain] : 0.001;
  const destChainGas = 0.0001; // Mantle gas fee
  const bridgeFee = (instruction.amount || 0) * 0.003; // 0.3% bridge fee
  
  return {
    estimatedTime: instruction.sourceChain === SourceChain.ETHEREUM ? 15 * 60 : 5 * 60, // in seconds
    fees: {
      sourceChainGas: `${sourceChainGas} ETH`,
      destChainGas: `0.0001 ETH`,
      bridgeFee: `${bridgeFee.toFixed(6)} ${instruction.token || 'tokens'}`
    },
    totalCost: `${(sourceChainGas + destChainGas).toFixed(6)} ETH + ${bridgeFee.toFixed(6)} ${instruction.token || 'tokens'}`
  };
}

/**
 * Generate step-by-step instructions for the user to complete the bridge
 * @param instruction Bridge instruction
 * @returns Array of instruction steps
 */
export function generateBridgeSteps(instruction: Partial<BridgeInstruction>): string[] {
  const sourceChain = instruction.sourceChain || 'your source chain';
  const token = instruction.token || 'your tokens';
  const amount = instruction.amount?.toString() || 'the specified amount';
  
  return [
    `Connect your wallet to ${sourceChain}`,
    `Ensure you have at least ${amount} ${token} and some native tokens for gas fees`,
    `Approve the bridge contract to spend your ${token} (if needed)`,
    `Confirm the transaction to lock your tokens on ${sourceChain}`,
    `Wait for the transaction to be confirmed (this may take a few minutes)`,
    `Switch your wallet to the Mantle network`,
    `Your bridged tokens will appear in your wallet on Mantle automatically once the process completes`
  ];
}

/**
 * Initiate a bridge transaction
 * @param instruction Bridge instruction
 * @returns Result of the bridge transaction initiation
 */
export async function initiateBridgeTransaction(instruction: BridgeInstruction): Promise<BridgeResult> {
  // This is a simulation - in production, you would:
  // 1. Call Wormhole's NTT SDK to initiate the bridge
  // 2. Track the transaction status
  // 3. Return real values
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    status: 'initiated',
    transactionHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
    estimatedTime: instruction.sourceChain === SourceChain.ETHEREUM ? 900 : 300, // in seconds
    fees: {
      sourceChainGas: '0.003 ETH',
      destChainGas: '0.0001 MNT',
      bridgeFee: `${(instruction.amount * 0.003).toFixed(6)} ${instruction.token}`
    }
  };
}

/**
 * Get bridge transaction status
 * @param transactionHash Hash of the bridge transaction
 * @returns Current status of the bridge transaction
 */
export async function getBridgeTransactionStatus(transactionHash: string): Promise<BridgeResult> {
  // In production, this would query Wormhole's API for the transaction status
  // For now, we'll simulate a response
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Randomly decide if the transaction is completed or still in progress
  const isCompleted = Math.random() > 0.6;
  
  return {
    status: isCompleted ? 'completed' : 'initiated',
    transactionHash,
    estimatedTime: isCompleted ? 0 : 300 // in seconds
  };
}

/**
 * Generate a natural language summary of a bridge transaction
 * @param instruction Bridge instruction
 * @param result Bridge result
 * @returns Human-readable summary of the bridge transaction
 */
export async function generateBridgeSummary(
  instruction: Partial<BridgeInstruction>,
  result: BridgeResult
): Promise<string> {
  try {
    if (!canUseOpenAI || !openai) {
      // Fall back to template summary if OpenAI is not available
      return `You're bridging ${instruction.amount} ${instruction.token} from ${instruction.sourceChain} to Mantle. ${
        result.status === 'completed' 
          ? 'The bridge process has completed successfully!' 
          : result.status === 'initiated'
            ? `The bridge process has been initiated. It will take approximately ${Math.ceil((result.estimatedTime || 300) / 60)} minutes to complete.`
            : 'The bridge process failed. Please try again.'
      }`;
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `You are a helpful bridge assistant for the Money Button application.
          Generate a friendly, informative summary of a bridge transaction using the provided details.
          Be concise but informative, and include the key details about the transaction.`
        },
        {
          role: 'user',
          content: `Generate a summary of this bridge transaction:
          - Source Chain: ${instruction.sourceChain}
          - Token: ${instruction.token}
          - Amount: ${instruction.amount}
          - Destination Chain: Mantle
          - Status: ${result.status}
          - Transaction Hash: ${result.transactionHash || 'Not available'}
          - Estimated Time: ${result.estimatedTime || 'Unknown'} seconds
          ${result.fees ? `- Fees: Source Chain Gas: ${result.fees.sourceChainGas}, Destination Chain Gas: ${result.fees.destChainGas}, Bridge Fee: ${result.fees.bridgeFee}` : ''}
          ${result.error ? `- Error: ${result.error}` : ''}`
        }
      ]
    });
    
    return response.choices[0]?.message?.content || 
      `You're bridging ${instruction.amount} ${instruction.token} from ${instruction.sourceChain} to Mantle. ${
        result.status === 'completed' 
          ? 'The bridge process has completed successfully!' 
          : result.status === 'initiated'
            ? `The bridge process has been initiated. It will take approximately ${Math.ceil((result.estimatedTime || 300) / 60)} minutes to complete.`
            : 'The bridge process failed. Please try again.'
      }`;
  } catch (error) {
    console.error('Error generating bridge summary:', error);
    
    // Return a simple templated summary in case of error
    return `You're bridging ${instruction.amount} ${instruction.token} from ${instruction.sourceChain} to Mantle. ${
      result.status === 'completed' 
        ? 'The bridge process has completed successfully!' 
        : result.status === 'initiated'
          ? `The bridge process has been initiated. It will take approximately ${Math.ceil((result.estimatedTime || 300) / 60)} minutes to complete.`
          : 'The bridge process failed. Please try again.'
    }`;
  }
}

export const agentKitBridgeService = {
  processNaturalLanguageBridge,
  estimateBridgeTransaction,
  generateBridgeSteps,
  initiateBridgeTransaction,
  getBridgeTransactionStatus,
  generateBridgeSummary
}; 