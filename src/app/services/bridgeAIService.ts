import OpenAI from 'openai';

// Check if AI features are enabled (defaults to false if not specified)
const AI_FEATURES_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === 'true';

// Get API key from environment with a safer approach
const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// Check if we have a valid API key before initializing
const hasValidApiKey = !!API_KEY && API_KEY.length > 0 && !API_KEY.includes('your-api-key');

// Only attempt to use OpenAI if both conditions are met
const canUseOpenAI = AI_FEATURES_ENABLED && hasValidApiKey;

// Track rate limit status to avoid repeated failed calls
let isRateLimited = false;
let rateLimitResetTime = 0;
const RATE_LIMIT_COOLDOWN = 60 * 1000; // 1 minute cooldown if rate limited

// Initialize OpenAI only if we have a valid API key
const openai = canUseOpenAI ? new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // Allow client-side usage
}) : null;

// Log OpenAI status on initialization
console.log(`[Bridge] AI Features: ${AI_FEATURES_ENABLED ? 'Enabled' : 'Disabled'}`);
console.log(`[Bridge] OpenAI Client: ${openai ? 'Initialized' : 'Not Available'}`);

// Simple cache to store responses and reduce API calls
const responseCache: Record<string, { response: string | any, timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // Cache entries expire after 5 minutes (reduced from 30 minutes)

// Message type definitions
export type MessageType = {
  content: string;
  role: 'user' | 'assistant' | 'system';
};

// Bridge-specific types
export type BridgeCommand = {
  intent: string;
  sourceChain: string | null;
  destinationChain: string | null;
  token: string | null;
  amount: number | null;
  confidence: number;
};

// Prebuilt responses for different scenarios
const FALLBACK_RESPONSES = {
  bridgeQuery: [
    "I can help you bridge your tokens to Mantle Network. What would you like to know?",
    "To bridge tokens to Mantle Network, you'll need to connect your wallet, select a source chain, choose a token, and specify an amount.",
    "The bridge process involves locking your tokens on the source chain and minting equivalent tokens on Mantle.",
    "Bridging typically takes a few minutes to complete, depending on the source chain and network congestion.",
    "Mantle's bridge is powered by Wormhole technology, ensuring secure and reliable token transfers."
  ],
  bridgeCommand: {
    default: {
      intent: "bridge",
      sourceChain: null,
      destinationChain: "Mantle",
      token: null,
      amount: null,
      confidence: 0.5
    },
    ethereum: {
      intent: "bridge",
      sourceChain: "ethereum" as any, // Type cast to fix compatibility
      destinationChain: "Mantle",
      token: null,
      amount: null,
      confidence: 0.7
    }
  },
  bridgeProcess: [
    "To bridge your tokens, first connect your wallet to the source chain, select the token you want to bridge, enter the amount, and confirm the transaction. The tokens will be locked on the source chain and minted on Mantle in a few minutes.",
    "The bridging process securely transfers your tokens from the source chain to Mantle by locking them on the source side and minting the equivalent amount on Mantle. This process typically takes 3-15 minutes depending on network conditions.",
    "Bridging to Mantle is a secure process that utilizes Wormhole's cross-chain communication protocol to ensure your tokens are transferred reliably. Gas fees vary by source chain but are generally lower than typical DeFi transactions."
  ],
  bridgeInstructions: [
    "1. Connect your wallet\n2. Select your source chain\n3. Choose the token to bridge\n4. Enter the amount\n5. Confirm the transaction",
    "1. Ensure your wallet is connected\n2. Verify you have sufficient tokens and gas fees\n3. Enter the desired amount\n4. Approve the token (if needed)\n5. Confirm the bridge transaction",
    "1. Connect your wallet to the source chain\n2. Select the token you want to bridge\n3. Enter the amount to transfer\n4. Review the transaction details\n5. Confirm and wait for completion"
  ]
};

/**
 * Get a random response from a predefined list
 * @param responses Array of possible responses
 * @returns A randomly selected response
 */
const getRandomResponse = (responses: string[]): string => {
  const index = Math.floor(Math.random() * responses.length);
  return responses[index];
};

/**
 * Get a cached response or generate a new one
 * @param cacheKey The cache key
 * @param generator Function to generate a new response
 * @param fallbackResponses Fallback responses if generation fails
 */
const getCachedOrGenerate = async <T>(
  cacheKey: string,
  generator: () => Promise<T>,
  fallbackResponses: T | T[]
): Promise<T> => {
  // If AI features are disabled, just return a random fallback response
  if (!AI_FEATURES_ENABLED) {
    return Array.isArray(fallbackResponses) 
      ? fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)] 
      : fallbackResponses;
  }
  
  // Select a random fallback for this request if it's an array
  const fallback = Array.isArray(fallbackResponses) 
    ? fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)] 
    : fallbackResponses;
  
  // Check if we have a valid cached response
  const cached = responseCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response as T;
  }
  
  // If we're rate limited and the cooldown hasn't passed, use cached or fallback
  if (isRateLimited && Date.now() < rateLimitResetTime) {
    console.log('[Bridge] Using fallback due to rate limiting');
    return cached ? cached.response as T : fallback;
  }
  
  // If we don't have a valid API key or OpenAI instance, return fallback
  if (!hasValidApiKey || !openai) {
    console.log('[Bridge] No valid API key, using fallback');
    return fallback;
  }
  
  try {
    // Generate new response
    const response = await generator();
    
    // Cache the response
    responseCache[cacheKey] = {
      response,
      timestamp: Date.now()
    };
    
    // Successfully called API, reset rate limit flag
    isRateLimited = false;
    
    return response;
  } catch (error: any) {
    console.error('[Bridge] Error generating response:', error);
    
    // Check if it's a rate limit error (429)
    if (error?.status === 429) {
      isRateLimited = true;
      rateLimitResetTime = Date.now() + RATE_LIMIT_COOLDOWN;
      console.log(`[Bridge] Rate limited. Will try again after ${new Date(rateLimitResetTime).toLocaleTimeString()}`);
    }
    
    // If we have an expired cached response, use it instead of the fallback
    if (cached) {
      return cached.response as T;
    }
    
    return fallback;
  }
};

/**
 * Process a user query related to bridging tokens
 * @param message User's message about bridging
 * @param context Additional context for the AI
 * @returns AI-generated bridge assistant response
 */
export const processBridgeQuery = async (message: string, context?: any) => {
  // Create a cache key based on the message and context
  const contextHash = context ? Object.values(context).join('-') : 'no-context';
  const cacheKey = `bridge_query_${message.substring(0, 50)}_${contextHash}`;
  
  console.log("[Bridge] Processing query:", message);
  console.log("[Bridge] AI_FEATURES_ENABLED:", AI_FEATURES_ENABLED);
  console.log("[Bridge] hasValidApiKey:", hasValidApiKey);
  console.log("[Bridge] openai client available:", !!openai);
  
  return getCachedOrGenerate<string>(
    cacheKey,
    async () => {
      // Check if OpenAI instance is available
      if (!openai) {
        console.log("[Bridge] OpenAI API not available in generator");
        throw new Error('OpenAI API not available');
      }
      
      // Bridge-specific system prompt
      const systemPrompt = `You are a helpful bridge assistant for the Money Button application. 
      You specialize in helping users understand how to bridge their tokens from other chains to Mantle Network.
      Provide clear, technical but accessible information about bridging options, gas fees, and necessary steps.
      Be concise, precise, and slightly technical in your responses.`;
      
      // Build complete context for more personalized responses
      const contextStr = context ? 
        `User context: ${JSON.stringify(context)}. Use this information to personalize your response.` : '';
      
      const messages: MessageType[] = [
        { role: 'system', content: systemPrompt + ' ' + contextStr },
        { role: 'user', content: message }
      ];
      
      console.log("[Bridge] Calling OpenAI API with messages:", JSON.stringify(messages));
      
      try {
        // Call OpenAI API
        const response = await openai.chat.completions.create({
          messages: messages as any,
          model: 'gpt-3.5-turbo',
          temperature: 0.3, // Lower temperature for more accurate, technical responses
          max_tokens: 250
        });
        
        console.log("[Bridge] OpenAI API response received");
        return response.choices[0]?.message?.content || getRandomResponse(FALLBACK_RESPONSES.bridgeQuery);
      } catch (error) {
        console.error("[Bridge] OpenAI API error:", error);
        return getRandomResponse(FALLBACK_RESPONSES.bridgeQuery);
      }
    },
    FALLBACK_RESPONSES.bridgeQuery
  );
};

/**
 * Analyze a bridge command to extract relevant information
 * @param message User's bridge command message
 * @returns Object with parsed bridge command details
 */
export const analyzeBridgeCommand = async (message: string): Promise<BridgeCommand> => {
  // Create a cache key based on the message
  const cacheKey = `analyze_command_${message.substring(0, 50)}`;
  
  // Default fallback based on the message content
  let fallback = FALLBACK_RESPONSES.bridgeCommand.default;
  
  // If the message mentions ethereum, use the ethereum fallback
  if (message.toLowerCase().includes('ethereum') || message.toLowerCase().includes('eth')) {
    fallback = FALLBACK_RESPONSES.bridgeCommand.ethereum;
  }
  
  return getCachedOrGenerate<BridgeCommand>(
    cacheKey,
    async () => {
      // Check if OpenAI instance is available
      if (!openai) {
        throw new Error('OpenAI API not available');
      }
      
      const systemPrompt = `You are an AI assistant for a cross-chain bridge. Extract bridge operation details from the user message.
      Look for: 
      - Intent (bridge, transfer, send, etc.)
      - Source chain (Ethereum, Polygon, BSC, etc.)
      - Destination chain (Mantle is the default if not specified)
      - Token (ETH, USDC, USDT, etc.)
      - Amount (numeric value)
      
      Return a structured JSON with these fields, with null for any missing values. 
      Include a confidence value between 0 and 1.`;
      
      const response = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract bridge information from: "${message}"` }
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.1, // Very low temperature for more deterministic parsing
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0]?.message?.content || 
        JSON.stringify(fallback);
      
      return JSON.parse(content) as BridgeCommand;
    },
    fallback
  );
};

/**
 * Generate a response explaining a specific bridging process
 * @param sourceChain The source blockchain
 * @param destinationChain The destination blockchain (usually Mantle)
 * @param token The token being bridged
 * @param amount The amount being bridged
 * @returns AI-generated explanation of the bridging process
 */
export const explainBridgeProcess = async (
  sourceChain: string,
  destinationChain: string = 'Mantle',
  token: string,
  amount: number
) => {
  // Create a cache key based on the parameters
  const cacheKey = `explain_process_${sourceChain}_${destinationChain}_${token}_${amount}`;
  
  // Create custom fallback that includes the specific parameters
  const customFallbacks = FALLBACK_RESPONSES.bridgeProcess.map(response => {
    return response.replace(/your tokens/g, `${amount} ${token}`).replace(/source chain/g, sourceChain);
  });
  
  return getCachedOrGenerate<string>(
    cacheKey,
    async () => {
      // Check if OpenAI instance is available
      if (!openai) {
        throw new Error('OpenAI API not available');
      }
      
      const prompt = `Explain how to bridge ${amount} ${token} from ${sourceChain} to ${destinationChain} with a focus on technical accuracy, security, and efficiency. Include estimated time and any fees to consider.`;
      
      const systemMessage = `You are a technical cross-chain bridge expert for the Money Button application.
      Your explanations should be technically accurate, include security considerations, and focus on Wormhole as the underlying bridge technology.
      Include estimated time frames, gas fees when relevant, and any special considerations for this specific token and chain pair.`;
      
      const response = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.4,
        max_tokens: 300
      });
      
      return response.choices[0]?.message?.content || getRandomResponse(customFallbacks);
    },
    customFallbacks
  );
};

/**
 * Generate step-by-step instructions for a specific bridge operation
 * @param bridgeDetails The details of the bridge operation
 * @returns AI-generated step-by-step instructions
 */
export const generateBridgeInstructions = async (bridgeDetails: {
  sourceChain: string;
  token: string;
  amount: number;
}) => {
  const { sourceChain, token, amount } = bridgeDetails;
  
  // Create a cache key based on the bridge details
  const cacheKey = `instructions_${sourceChain}_${token}_${amount}`;
  
  // Create custom fallback that includes the specific parameters
  const customFallbacks = FALLBACK_RESPONSES.bridgeInstructions.map(response => {
    // Already numbered instructions, so we just replace token and amount where they appear
    return response.replace(/the token/g, token).replace(/the amount/g, `${amount}`);
  });
  
  return getCachedOrGenerate<string>(
    cacheKey,
    async () => {
      // Check if OpenAI instance is available
      if (!openai) {
        throw new Error('OpenAI API not available');
      }
      
      const prompt = `Generate numbered step-by-step instructions for bridging ${amount} ${token} from ${sourceChain} to Mantle Network.`;
      
      const systemPrompt = `You are creating technical instructions for users to bridge crypto assets.
      Your instructions should be:
      1. Numbered steps (1-5 maximum)
      2. Clear and concise
      3. Security-focused
      4. Technically accurate
      Format the response as a numbered list with short, actionable steps.`;
      
      const response = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        max_tokens: 250
      });
      
      return response.choices[0]?.message?.content || getRandomResponse(customFallbacks);
    },
    customFallbacks
  );
};

export default {
  processBridgeQuery,
  analyzeBridgeCommand,
  explainBridgeProcess,
  generateBridgeInstructions
}; 