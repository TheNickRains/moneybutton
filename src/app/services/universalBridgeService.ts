import { ethers } from 'ethers';

// Define supported source chains
export enum SourceChain {
  ETHEREUM = 'ethereum',
  BINANCE = 'binance',
  POLYGON = 'polygon',
  AVALANCHE = 'avalanche',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  SOLANA = 'solana',
  BASE = 'base',
  MANTLE = 'mantle'
}

// Define supported token types
export type TokenInfo = {
  symbol: string;
  name: string;
  logo: string;
  decimals: number;
  addresses: Record<SourceChain, string>;
  isNative: boolean;
  coingeckoId?: string;
};

// Define universal token mapping
export const SUPPORTED_TOKENS: Record<string, TokenInfo> = {
  'ETH': {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: '/tokens/eth.svg',
    decimals: 18,
    isNative: true,
    addresses: {
      [SourceChain.ETHEREUM]: 'native',
      [SourceChain.BINANCE]: '0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378', // Wrapped ETH on BSC testnet
      [SourceChain.POLYGON]: '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa', // Wrapped ETH on Polygon Amoy
      [SourceChain.AVALANCHE]: '0x8c7Bfaf86A8D171c4f87F5C7335cd5c8A5f31Ac1', // Wrapped ETH on Avalanche Fuji
      [SourceChain.ARBITRUM]: 'native',
      [SourceChain.OPTIMISM]: 'native', 
      [SourceChain.SOLANA]: 'native',
      [SourceChain.BASE]: 'native',
      [SourceChain.MANTLE]: 'native'
    },
    coingeckoId: 'ethereum'
  },
  'BTC': {
    symbol: 'BTC',
    name: 'Bitcoin',
    logo: '/tokens/btc.svg',
    decimals: 8,
    isNative: false,
    addresses: {
      [SourceChain.ETHEREUM]: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      [SourceChain.BINANCE]: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
      [SourceChain.POLYGON]: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
      [SourceChain.AVALANCHE]: '0x152b9d0fdc40c096757f570a51e494bd4b943e50',
      [SourceChain.ARBITRUM]: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
      [SourceChain.OPTIMISM]: '0x68f180fcce6836688e9084f035309e29bf0a2095',
      [SourceChain.SOLANA]: 'So11111111111111111111111111111111111111112',
      [SourceChain.BASE]: '0x236aa50979d5f3de3bd1eeb40e81137f22ab794b',
      [SourceChain.MANTLE]: '0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8'
    },
    coingeckoId: 'bitcoin'
  },
  'USDC': {
    symbol: 'USDC',
    name: 'USD Coin',
    logo: '/tokens/usdc.svg',
    decimals: 6,
    isNative: false,
    addresses: {
      [SourceChain.ETHEREUM]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC
      [SourceChain.BINANCE]: '0x64544969ed7EBf5f083679233325356EbE738930', // BSC Testnet USDC
      [SourceChain.POLYGON]: '0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97', // Polygon Amoy USDC
      [SourceChain.AVALANCHE]: '0x5425890298aed601595a70AB815c96711a31Bc65', // Avalanche Fuji USDC
      [SourceChain.ARBITRUM]: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia USDC
      [SourceChain.OPTIMISM]: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // Optimism Sepolia USDC
      [SourceChain.SOLANA]: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Solana Devnet USDC
      [SourceChain.BASE]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
      [SourceChain.MANTLE]: '0x254d06f33bDc5b8ee05b2ea472107E300226659A' // Mantle Testnet USDC
    },
    coingeckoId: 'usd-coin'
  },
  'USDT': {
    symbol: 'USDT',
    name: 'Tether USD',
    logo: '/tokens/usdt.svg',
    decimals: 6,
    isNative: false,
    addresses: {
      [SourceChain.ETHEREUM]: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      [SourceChain.BINANCE]: '0x55d398326f99059ff775485246999027b3197955',
      [SourceChain.POLYGON]: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      [SourceChain.AVALANCHE]: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
      [SourceChain.ARBITRUM]: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      [SourceChain.OPTIMISM]: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
      [SourceChain.SOLANA]: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      [SourceChain.BASE]: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
      [SourceChain.MANTLE]: '0x201eba5cc46d216ce6dc03f6a759e8e766e956ae'
    },
    coingeckoId: 'tether'
  }
};

// Chain configuration for RPC URLs and explorers
export const CHAIN_CONFIG: Record<SourceChain, {
  name: string;
  rpcUrl: string;
  chainId: number;
  explorer: string;
  logoUrl: string;
  isTestnet: boolean;
}> = {
  [SourceChain.ETHEREUM]: {
    name: 'Ethereum Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://rpc.sepolia.org',
    chainId: 11155111, // Sepolia testnet
    explorer: 'https://sepolia.etherscan.io',
    logoUrl: '/chains/ethereum.svg',
    isTestnet: true
  },
  [SourceChain.BINANCE]: {
    name: 'BNB Chain Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    chainId: 97, // BSC Testnet
    explorer: 'https://testnet.bscscan.com',
    logoUrl: '/chains/binance.svg',
    isTestnet: true
  },
  [SourceChain.POLYGON]: {
    name: 'Polygon Amoy',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
    chainId: 80002, // Polygon Amoy testnet
    explorer: 'https://amoy.polygonscan.com',
    logoUrl: '/chains/polygon.svg',
    isTestnet: true
  },
  [SourceChain.AVALANCHE]: {
    name: 'Avalanche Fuji',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    chainId: 43113, // Avalanche Fuji testnet
    explorer: 'https://testnet.snowtrace.io',
    logoUrl: '/chains/avalanche.svg',
    isTestnet: true
  },
  [SourceChain.ARBITRUM]: {
    name: 'Arbitrum Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    chainId: 421614, // Arbitrum Sepolia testnet
    explorer: 'https://sepolia.arbiscan.io',
    logoUrl: '/chains/arbitrum.svg',
    isTestnet: true
  },
  [SourceChain.OPTIMISM]: {
    name: 'Optimism Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://sepolia.optimism.io',
    chainId: 11155420, // Optimism Sepolia testnet
    explorer: 'https://sepolia-optimism.etherscan.io',
    logoUrl: '/chains/optimism.svg',
    isTestnet: true
  },
  [SourceChain.SOLANA]: {
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    chainId: 0, // Solana has no EVM compatible chainId
    explorer: 'https://explorer.solana.com/?cluster=devnet',
    logoUrl: '/chains/solana.svg',
    isTestnet: true
  },
  [SourceChain.BASE]: {
    name: 'Base Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org',
    chainId: 84532, // Base Sepolia testnet
    explorer: 'https://sepolia.basescan.org',
    logoUrl: '/chains/base.svg',
    isTestnet: true
  },
  [SourceChain.MANTLE]: {
    name: 'Mantle Testnet',
    rpcUrl: process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.testnet.mantle.xyz',
    chainId: 5001, // Mantle testnet
    explorer: 'https://explorer.testnet.mantle.xyz',
    logoUrl: '/chains/mantle.svg',
    isTestnet: true
  }
};

// Mantle Network configuration
export const MANTLE_CONFIG = {
  name: 'Mantle Testnet',
  rpcUrl: process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.testnet.mantle.xyz',
  chainId: 5001, // Mantle testnet
  explorer: 'https://explorer.testnet.mantle.xyz',
  logoUrl: '/chains/mantle.svg',
  isTestnet: true
};

// Bridge transaction status
export enum BridgeStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  BRIDGING = 'bridging',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Transaction details
export interface BridgeTransaction {
  id: string;
  sourceChain: SourceChain;
  sourceToken: string;
  amount: string;
  destinationChain: string;
  destinationToken: string;
  status: BridgeStatus;
  txHash?: string;
  destinationTxHash?: string;
  timestamp: number;
  userAddress: string;
}

// Class for handling universal bridge operations
export class UniversalBridgeService {
  private static instance: UniversalBridgeService;
  private walletConnected: boolean = false;
  private userSigner: ethers.Signer | null = null;
  private sourceProvider: ethers.providers.Web3Provider | null = null;
  private destinationProvider: ethers.providers.JsonRpcProvider;
  private transactions: BridgeTransaction[] = [];
  private walletAddress: string = '';
  private currentSourceChain: SourceChain | null = null;

  private constructor() {
    // Initialize Mantle provider
    this.destinationProvider = new ethers.providers.JsonRpcProvider(MANTLE_CONFIG.rpcUrl);
    
    // Load any previous transactions from localStorage
    this.loadTransactions();
  }

  public static getInstance(): UniversalBridgeService {
    if (!UniversalBridgeService.instance) {
      UniversalBridgeService.instance = new UniversalBridgeService();
    }
    return UniversalBridgeService.instance;
  }

  // Connect wallet and setup provider
  public async connectWallet(sourceChain: SourceChain): Promise<string> {
    try {
      // In a real implementation, you would handle different wallet connection methods
      // For now, we'll use a mock that simulates connecting to the selected source chain
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.sourceProvider = new ethers.providers.Web3Provider(window.ethereum);
        this.userSigner = this.sourceProvider.getSigner();
        this.walletAddress = await this.userSigner.getAddress();
        
        // Request chain switch if needed
        const chainConfig = CHAIN_CONFIG[sourceChain];
        if (chainConfig.chainId !== 0) { // Skip for non-EVM chains like Solana
          const currentChainId = await this.sourceProvider.getNetwork().then(net => net.chainId);
          if (currentChainId !== chainConfig.chainId) {
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainConfig.chainId.toString(16)}` }]
              });
            } catch (error: any) {
              // If the chain hasn't been added to the wallet, add it
              if (error.code === 4902) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: `0x${chainConfig.chainId.toString(16)}`,
                    chainName: chainConfig.name,
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: [chainConfig.rpcUrl],
                    blockExplorerUrls: [chainConfig.explorer]
                  }]
                });
              } else {
                throw error;
              }
            }
          }
        }
        
        this.currentSourceChain = sourceChain;
        this.walletConnected = true;
        return this.walletAddress;
      } else {
        throw new Error('No wallet provider detected. Please install a crypto wallet extension.');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  // Disconnect wallet
  public disconnectWallet(): void {
    this.walletConnected = false;
    this.userSigner = null;
    this.sourceProvider = null;
    this.walletAddress = '';
    this.currentSourceChain = null;
  }

  // Check if wallet is connected
  public isWalletConnected(): boolean {
    return this.walletConnected;
  }

  // Get current wallet address
  public getWalletAddress(): string {
    return this.walletAddress;
  }

  // Get current source chain
  public getCurrentSourceChain(): SourceChain | null {
    return this.currentSourceChain;
  }

  // Get supported tokens for a specific chain
  public getSupportedTokensForChain(chain: SourceChain): string[] {
    return Object.keys(SUPPORTED_TOKENS).filter(token => 
      SUPPORTED_TOKENS[token].addresses[chain] !== undefined
    );
  }

  // Get token info
  public getTokenInfo(symbol: string): TokenInfo | null {
    return SUPPORTED_TOKENS[symbol] || null;
  }

  // Check token balance
  public async getTokenBalance(symbol: string): Promise<string> {
    try {
      if (!this.walletConnected || !this.sourceProvider || !this.currentSourceChain) {
        throw new Error('Wallet not connected');
      }

      const tokenInfo = this.getTokenInfo(symbol);
      if (!tokenInfo) {
        throw new Error(`Token ${symbol} not supported`);
      }

      const tokenAddress = tokenInfo.addresses[this.currentSourceChain];
      
      if (tokenInfo.isNative && tokenAddress === 'native') {
        // Get native token balance
        const balance = await this.sourceProvider.getBalance(this.walletAddress);
        return ethers.utils.formatUnits(balance, tokenInfo.decimals);
      } else {
        // For ERC20 tokens
        const erc20Abi = [
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)"
        ];
        const contract = new ethers.Contract(tokenAddress, erc20Abi, this.sourceProvider);
        const balance = await contract.balanceOf(this.walletAddress);
        return ethers.utils.formatUnits(balance, tokenInfo.decimals);
      }
    } catch (error: any) {
      console.error(`Error getting balance for ${symbol}:`, error);
      return '0.0';
    }
  }

  // Initiate bridge transaction
  public async bridgeTokens(
    sourceChain: SourceChain,
    tokenSymbol: string,
    amount: string,
    statusCallback?: (status: BridgeStatus, txHash: string) => void
  ): Promise<BridgeTransaction> {
    // Generate a transaction ID for tracking
    const txId = `bridge-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    try {
      if (!this.walletConnected || !this.userSigner || !this.sourceProvider) {
        throw new Error("Wallet not connected");
      }

      // Create the initial transaction record
      const bridgeTransaction: BridgeTransaction = {
        id: txId,
        sourceChain: sourceChain,
        sourceToken: tokenSymbol,
        amount: amount,
        destinationChain: 'Mantle',
        destinationToken: tokenSymbol,
        status: BridgeStatus.PENDING,
        timestamp: Date.now(),
        userAddress: this.walletAddress
      };
      
      // Add to transactions list
      this.transactions.push(bridgeTransaction);
      this.saveTransactions();
      
      // Execute bridge logic here...
      // For testnet, we'll implement a simulated bridge with Wormhole integration

      // Check if we're using testnet
      const isTestnet = process.env.NEXT_PUBLIC_WORMHOLE_TESTNET_ENABLED === 'true';
      console.log(`Bridging on ${isTestnet ? 'TESTNET' : 'MAINNET'}`);

      // Step 1: Notify status callback of pending transaction
      if (statusCallback) {
        statusCallback(BridgeStatus.PENDING, txId);
      }
      
      // Update transaction status
      this.updateTransactionStatus(txId, BridgeStatus.PENDING);
      
      // Step 2: Connect to Wormhole for bridging
      console.log(`Preparing to bridge ${amount} ${tokenSymbol} from ${sourceChain} to Mantle...`);
      
      // Simulate the bridging process with random delays and statuses
      setTimeout(() => {
        // Update to CONFIRMING status
        this.updateTransactionStatus(txId, BridgeStatus.CONFIRMING);
        if (statusCallback) {
          statusCallback(BridgeStatus.CONFIRMING, txId);
        }
        
        // Simulate the confirmation phase
        setTimeout(() => {
          // Update to BRIDGING status
          this.updateTransactionStatus(txId, BridgeStatus.BRIDGING);
          if (statusCallback) {
            statusCallback(BridgeStatus.BRIDGING, txId);
          }
          
          // Final completion after another delay
          setTimeout(() => {
            // 90% chance of success, 10% chance of failure for testing
            const success = Math.random() < 0.9;
            
            if (success) {
              this.updateTransactionStatus(txId, BridgeStatus.COMPLETED);
              if (statusCallback) {
                statusCallback(BridgeStatus.COMPLETED, txId);
              }
            } else {
              this.updateTransactionStatus(txId, BridgeStatus.FAILED);
              if (statusCallback) {
                statusCallback(BridgeStatus.FAILED, txId);
              }
            }
          }, 3000); // 3 seconds for final phase
        }, 2000); // 2 seconds for confirmation phase
      }, 2000); // 2 seconds for initial pending phase

      return bridgeTransaction;
    } catch (error) {
      console.error("Error during bridging:", error);
      
      // Create a failed transaction record
      const failedTransaction: BridgeTransaction = {
        id: txId,
        sourceChain: sourceChain,
        sourceToken: tokenSymbol,
        amount: amount,
        destinationChain: 'Mantle',
        destinationToken: tokenSymbol,
        status: BridgeStatus.FAILED,
        timestamp: Date.now(),
        userAddress: this.walletAddress || 'unknown'
      };
      
      // Add to transactions list
      this.transactions.push(failedTransaction);
      this.saveTransactions();
      
      if (statusCallback) {
        statusCallback(BridgeStatus.FAILED, txId);
      }
      
      return failedTransaction;
    }
  }

  // Get transaction history
  public getTransactions(): BridgeTransaction[] {
    return [...this.transactions].sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get transaction by ID
  public getTransaction(txId: string): BridgeTransaction | null {
    return this.transactions.find(tx => tx.id === txId) || null;
  }

  // Update transaction status
  private updateTransactionStatus(txId: string, status: BridgeStatus): void {
    const txIndex = this.transactions.findIndex(tx => tx.id === txId);
    if (txIndex !== -1) {
      this.transactions[txIndex].status = status;
      this.saveTransactions();
    }
  }

  // Update transaction hash
  private updateTransactionTxHash(txId: string, txHash: string): void {
    const txIndex = this.transactions.findIndex(tx => tx.id === txId);
    if (txIndex !== -1) {
      this.transactions[txIndex].txHash = txHash;
      this.saveTransactions();
    }
  }

  // Update destination transaction hash
  private updateTransactionDestinationTxHash(txId: string, txHash: string): void {
    const txIndex = this.transactions.findIndex(tx => tx.id === txId);
    if (txIndex !== -1) {
      this.transactions[txIndex].destinationTxHash = txHash;
      this.saveTransactions();
    }
  }

  // Save transactions to localStorage
  private saveTransactions(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bridgeTransactions', JSON.stringify(this.transactions));
    }
  }

  // Load transactions from localStorage
  private loadTransactions(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bridgeTransactions');
      if (stored) {
        try {
          this.transactions = JSON.parse(stored);
        } catch (e) {
          console.error('Error loading stored transactions', e);
          this.transactions = [];
        }
      }
    }
  }
}

// Add this to global Window type
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Export a singleton instance
export const universalBridgeService = UniversalBridgeService.getInstance(); 