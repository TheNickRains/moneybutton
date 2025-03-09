import axios from 'axios';

// Price feed addresses for different networks
const PRICE_FEED_ADDRESSES = {
  'ETH': {
    mainnet: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    sepolia: '0x694AA1769357215DE4FAC081bf1f309aDC325306'
  },
  'BTC': {
    mainnet: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
    sepolia: '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43'
  },
  'MNT': {
    mantle: '0x3f12643D3f6f874d39C2a4c9f2Cd6f2DbAC877FC'
  },
  'USDC': {
    mainnet: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
    sepolia: '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E'
  }
};

// Network RPC URLs
const RPC_URLS = {
  mainnet: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
  sepolia: 'https://eth-sepolia.g.alchemy.com/v2/your-api-key',
  mantle: 'https://rpc.mantle.xyz'
};

// Get price from Chainlink feed
export async function getPriceFromChainlink(symbol: string, network = 'sepolia') {
  try {
    // Use Chainlink's data API for demo purposes to avoid complex provider setup
    const feedAddress = PRICE_FEED_ADDRESSES[symbol][network];
    if (!feedAddress) {
      throw new Error(`No price feed found for ${symbol} on ${network}`);
    }
    
    // Call contract using JSON-RPC
    const response = await axios.post(RPC_URLS[network], {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{
        to: feedAddress,
        data: '0xfeaf968c' // latestRoundData function signature
      }, 'latest']
    });
    
    // Parse response
    const data = response.data.result;
    if (!data) throw new Error('Invalid response');
    
    // Extract price from response (depends on decimals)
    const hexPrice = data.substring(66, 130); // Answer is the second parameter
    const price = parseInt(hexPrice, 16);
    
    // Process based on token decimals
    const decimals = symbol === 'USDC' ? 6 : 8;
    return price / Math.pow(10, decimals);
  } catch (error) {
    console.error(`Error fetching ${symbol} price:`, error);
    // Fallback to hardcoded values if API fails, for demo resilience
    const fallbackPrices = {
      'ETH': 3500,
      'BTC': 65000,
      'MNT': 0.59,
      'USDC': 1
    };
    return fallbackPrices[symbol];
  }
}

// Get all prices at once
export async function getAllPrices(network = 'sepolia') {
  const prices = {};
  const symbols = Object.keys(PRICE_FEED_ADDRESSES);
  
  await Promise.all(
    symbols.map(async (symbol) => {
      prices[symbol] = await getPriceFromChainlink(symbol, network);
    })
  );
  
  return prices;
} 