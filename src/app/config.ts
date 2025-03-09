/**
 * This configuration file properly handles environment variables in both 
 * server and client-side rendering contexts in Next.js
 */

// Server-side environment variables can be accessed directly
const getServerConfig = () => {
  return {
    openaiApiKey: process.env.OPENAI_API_KEY,
    wormholeRpcUrl: process.env.NEXT_PUBLIC_WORMHOLE_RPC_URL
  };
};

// Client-side environment variables must use the NEXT_PUBLIC_ prefix
const getClientConfig = () => {
  return {
    openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    wormholeRpcUrl: process.env.NEXT_PUBLIC_WORMHOLE_RPC_URL
  };
};

// Determine if we're on the server or client
const isServer = typeof window === 'undefined';

// Get the appropriate config
const config = isServer ? getServerConfig() : getClientConfig();

// Export configuration values
export const OPENAI_API_KEY = config.openaiApiKey;
export const WORMHOLE_RPC_URL = config.wormholeRpcUrl;

// Logging for debugging (will only appear in server logs or client console)
console.log(`Config initialized in ${isServer ? 'server' : 'client'} environment`);
console.log(`OpenAI API Key configured: ${OPENAI_API_KEY ? 'Yes' : 'No'}`); 