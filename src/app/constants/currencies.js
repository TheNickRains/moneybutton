export const SUPPORTED_CURRENCIES = [
  {
    symbol: 'MNT',
    name: 'Mantle',
    chain: 'Mantle',
    requiresBridging: false,
    decimals: 18
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    chain: 'Ethereum',
    requiresBridging: true,
    decimals: 18
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    chain: 'Bitcoin',
    requiresBridging: true,
    decimals: 8
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    chain: 'Ethereum',
    requiresBridging: true,
    decimals: 6
  }
]; 