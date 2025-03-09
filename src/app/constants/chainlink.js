export const CHAINLINK_PRICE_FEEDS = {
  // Mainnet feeds
  'ETH': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // ETH/USD
  'BTC': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c', // BTC/USD
  'MANTLE': '0x...',  // Replace with actual Mantle price feed
  'USDC': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', // USDC/USD
  
  // For testnet, use Sepolia feeds
  // 'ETH': '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  // etc.
};

export const CHAIN_IDS = {
  'Ethereum': 1,
  'Mantle': 5000,
  'Arbitrum': 42161,
  'Sepolia': 11155111
};

export const RPC_URLS = {
  1: 'https://eth.llamarpc.com',
  5000: 'https://rpc.mantle.xyz',
  42161: 'https://arb1.arbitrum.io/rpc',
  11155111: 'https://rpc.sepolia.org'
}; 