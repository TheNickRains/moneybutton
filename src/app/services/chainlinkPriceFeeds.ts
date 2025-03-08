/**
 * SIMULATED CHAINLINK PRICE FEEDS
 * 
 * In a real production app, this would connect to actual Chainlink Price Feed contracts
 * deployed on various blockchains. For demo purposes, we're simulating the behavior.
 * 
 * Real implementation would use ethers.js or viem to call the Chainlink aggregator contracts directly.
 */

// Interface matching Chainlink's price feed responses
interface ChainlinkPriceResponse {
  answer: number;       // Price value (scaled by decimals)
  decimals: number;     // Decimals to scale the answer
  updatedAt: number;    // Timestamp of last update
  roundId: string;      // Current round ID
}

// Cache mechanism to avoid excessive "network" calls
interface PriceCache {
  [pair: string]: {
    data: ChainlinkPriceResponse;
    timestamp: number;
  };
}

// Simulated price cache
const priceCache: PriceCache = {};
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

// Real Chainlink feed addresses (these would be used in production)
const CHAINLINK_FEEDS = {
  'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // Ethereum Mainnet
  'MATIC/USD': '0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676', // Ethereum Mainnet
  'SOL/USD': '0x4ffC43a60e009B551865A93d232E33Fce9f01507', // Ethereum Mainnet
  'BNB/USD': '0x14e613AC84a31f709eadbdF89C6CC390fDc9540A', // Ethereum Mainnet
  'MNT/USD': '0xfd0B9EF7631112210db8cDED0Ac08c4Cd643A60f', // This is a simulated feed as MNT price feed is not widely available
  'AVAX/USD': '0xFF3EEb22B5E3dE6e705b44749C2559d704923FD7', // Ethereum Mainnet
  'ARB/USD': '0xb2A824043730FE05F3A2ac444CD9B9A9bF2E95b0', // Ethereum Mainnet
  'OP/USD': '0x0D276FC14719f9292D5C1eA2198673d1f4269246', // Ethereum Mainnet
  'NEAR/USD': '0xC12A6d1D827e23318569B6Edae1Bc2b36E7CD802', // Ethereum Mainnet
};

// Base prices for our simulation - these represent recent market values
const BASE_PRICES: Record<string, number> = {
  'ETH/USD': 3821.52,    // Updated Ethereum price
  'MATIC/USD': 0.58,     // Updated Polygon price
  'SOL/USD': 144.83,     // Updated Solana price
  'BNB/USD': 574.15,     // Updated BNB Chain price
  'MNT/USD': 0.77,       // Updated Mantle token price
  'USDC/USD': 1.0,       // USDC is a stablecoin pegged to USD
  'AVAX/USD': 34.72,     // Updated Avalanche price
  'ARB/USD': 1.10,       // Updated Arbitrum price
  'OP/USD': 2.78,        // Updated Optimism price
  'NEAR/USD': 5.91       // Updated Near Protocol price
};

/**
 * Simulate Chainlink price feed responses with realistic market movements
 * In production, this would query actual Chainlink aggregator contracts
 */
async function simulateChainlinkResponse(pair: string): Promise<ChainlinkPriceResponse> {
  // Create a realistic market movement (+/- 0.1-2%)
  const basePrice = BASE_PRICES[pair] || 1.0;
  const volatility = 0.001 + (Math.random() * 0.019); // 0.1% to 2%
  const direction = (Math.random() * 2) - 1; // Random direction
  const priceChange = basePrice * volatility * direction;
  
  // Calculate new price with 8 decimals (Chainlink standard)
  const price = Math.max(0.01, basePrice + priceChange) * 100000000; // 8 decimals
  
  return {
    answer: price,
    decimals: 8,
    updatedAt: Date.now(),
    roundId: `0x${Math.floor(Date.now() / 1000).toString(16)}`
  };
}

/**
 * Get price from Chainlink Oracle (simulated for demo)
 * In production, this would call the latestRoundData() function on the aggregator contract
 */
export async function getChainlinkPrice(base: string, quote = 'USD'): Promise<number> {
  const pair = `${base}/${quote}`;
  
  // Check cache first
  const cachedData = priceCache[pair];
  const now = Date.now();
  
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    // Use cached data if not expired
    return cachedData.data.answer / Math.pow(10, cachedData.data.decimals);
  }
  
  try {
    // In production, this would use ethers.js or viem to call Chainlink contracts
    // const contract = new ethers.Contract(CHAINLINK_FEEDS[pair], AggregatorV3Interface, provider);
    // const roundData = await contract.latestRoundData();
    // const decimals = await contract.decimals();
    
    // Simulate a network delay for realism
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
    
    // Get simulated price data
    const priceData = await simulateChainlinkResponse(pair);
    
    // Update cache
    priceCache[pair] = {
      data: priceData,
      timestamp: now
    };
    
    // Return price normalized by decimals
    return priceData.answer / Math.pow(10, priceData.decimals);
  } catch (error) {
    console.error(`Error fetching price for ${pair}:`, error);
    
    // Use cached data even if expired in case of API failure
    if (cachedData) {
      return cachedData.data.answer / Math.pow(10, cachedData.data.decimals);
    }
    
    // Fallback to base price if no cached data
    return BASE_PRICES[pair] || 1.0;
  }
}

/**
 * Formats a price with proper decimal places and suffix (K, M)
 */
export function formatPrice(value: number, decimals = 2): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  } else {
    return value.toFixed(decimals);
  }
}

// Add to pot with different currencies
const addToPot = (amount: number, currency = 'MNT') => {
  try {
    // Validate inputs
    if (amount <= 0) {
      console.warn("Invalid contribution amount", amount);
      return;
    }
    
    // Ensure the currency exists in our rates
    if (!conversionRates[currency]) {
      console.warn(`Unsupported currency: ${currency}, defaulting to MNT`);
      currency = 'MNT';
    }
    
    // Convert amount to MNT if it's not already in MNT
    const mntAmount = currency === 'MNT' 
      ? amount 
      : amount * (conversionRates['MNT'] / conversionRates[currency]);

    // Update the pot with 80% of the bet amount
    setPot(prev => prev + (mntAmount * 0.8));
    
    // Track user contribution (full amount for user stats)
    setUserContribution(prev => prev + mntAmount);
    setTotalContributors(prev => prev + 1);
    
    // Other logic...
  } catch (error) {
    // Error handling...
  }
}; 