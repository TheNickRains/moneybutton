import { ethers } from 'ethers';

// Default Ethereum chain configuration
const DEFAULT_CHAIN_ID = 1; // Ethereum Mainnet

// Mantle Network configuration
const MANTLE_MAINNET_CHAIN_ID = 5000;
const MANTLE_TESTNET_CHAIN_ID = 5001;
const MANTLE_MAINNET_RPC_URL = 'https://rpc.mantle.xyz';
const MANTLE_TESTNET_RPC_URL = 'https://rpc.testnet.mantle.xyz';

// Wallet options
interface WalletOptions {
  appName: string;
  appLogoUrl?: string;
}

// Singleton instance of the service
let walletInstance: MockWalletService | null = null;

export class MockWalletService {
  private connected: boolean = false;
  private accounts: string[] = [];
  private chainId: number = DEFAULT_CHAIN_ID;
  private options: WalletOptions;
  // Mock provider for simulation
  private mockProvider: ethers.providers.Web3Provider | null = null;

  // Private constructor for singleton pattern
  private constructor(options: WalletOptions) {
    this.options = options;
    // Initialize a simple mock provider if needed in the future
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        this.mockProvider = new ethers.providers.Web3Provider(window.ethereum);
      } catch (e) {
        console.log('No actual provider available for ethers');
      }
    }
  }

  // Get singleton instance
  public static getInstance(options: WalletOptions): MockWalletService {
    if (!walletInstance) {
      walletInstance = new MockWalletService(options);
    }
    return walletInstance;
  }

  // Connect to the wallet (mock implementation)
  public async connect(): Promise<string[]> {
    console.log(`[MOCK] Connecting to wallet for app: ${this.options.appName}`);
    
    try {
      // Try using window.ethereum if available (like MetaMask)
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.accounts = accounts;
        this.connected = accounts.length > 0;
        return accounts;
      }
      
      // Fallback to mock accounts if no real provider
      const mockAccount = '0x1234567890abcdef1234567890abcdef12345678';
      this.accounts = [mockAccount];
      this.connected = true;
      
      // For demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return this.accounts;
    } catch (error) {
      console.error('[MOCK] Failed to connect wallet:', error);
      throw error;
    }
  }

  // Disconnect from the wallet (mock implementation)
  public async disconnect(): Promise<void> {
    console.log('[MOCK] Disconnecting wallet');
    
    // Clear local connection state
    this.connected = false;
    this.accounts = [];
    
    // For demo purposes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Switch to a specified chain (mock implementation)
  public async switchChain(chainId: number): Promise<void> {
    console.log(`[MOCK] Switching to chain ID: ${chainId}`);
    
    try {
      // Try using window.ethereum if available
      if (typeof window !== 'undefined' && window.ethereum && this.mockProvider) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
        this.chainId = chainId;
        return;
      }
      
      // Simulate chain switch otherwise
      await new Promise(resolve => setTimeout(resolve, 800));
      this.chainId = chainId;
      
    } catch (error: any) {
      if (error.code === 4902) {
        await this.addChain(chainId);
      } else {
        console.error('[MOCK] Failed to switch chain:', error);
        throw error;
      }
    }
  }

  // Add a chain to the wallet (mock implementation)
  public async addChain(chainId: number): Promise<void> {
    console.log(`[MOCK] Adding chain ID: ${chainId}`);
    
    // Define chain parameters based on the chain ID
    let chainParams;
    
    switch (chainId) {
      case MANTLE_MAINNET_CHAIN_ID:
        chainParams = {
          chainId: `0x${MANTLE_MAINNET_CHAIN_ID.toString(16)}`,
          chainName: 'Mantle',
          nativeCurrency: {
            name: 'MNT',
            symbol: 'MNT',
            decimals: 18
          },
          rpcUrls: [MANTLE_MAINNET_RPC_URL],
          blockExplorerUrls: ['https://explorer.mantle.xyz']
        };
        break;
      case MANTLE_TESTNET_CHAIN_ID:
        chainParams = {
          chainId: `0x${MANTLE_TESTNET_CHAIN_ID.toString(16)}`,
          chainName: 'Mantle Testnet',
          nativeCurrency: {
            name: 'MNT',
            symbol: 'MNT',
            decimals: 18
          },
          rpcUrls: [MANTLE_TESTNET_RPC_URL],
          blockExplorerUrls: ['https://explorer.testnet.mantle.xyz']
        };
        break;
      default:
        throw new Error(`[MOCK] Chain ID ${chainId} not supported`);
    }

    try {
      // Try using window.ethereum if available
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [chainParams],
        });
        return;
      }
      
      // Simulate adding chain
      await new Promise(resolve => setTimeout(resolve, 800));
      this.chainId = chainId;
      
    } catch (error) {
      console.error('[MOCK] Failed to add chain:', error);
      throw error;
    }
  }

  // Get current account address
  public getAccount(): string | null {
    return this.accounts.length > 0 ? this.accounts[0] : null;
  }

  // Get current chain ID
  public getChainId(): number {
    return this.chainId;
  }

  // Get ethers provider (or null for mock)
  public getProvider(): ethers.providers.Web3Provider | null {
    return this.mockProvider;
  }

  // Get signer from provider
  public getSigner(): ethers.Signer | null {
    return this.mockProvider ? this.mockProvider.getSigner() : null;
  }

  // Check if wallet is connected
  public isConnected(): boolean {
    return this.connected;
  }

  // Send a transaction (mock implementation)
  public async sendTransaction(transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>): Promise<any> {
    console.log('[MOCK] Sending transaction:', transaction);
    
    if (this.mockProvider) {
      try {
        const signer = this.mockProvider.getSigner();
        return await signer.sendTransaction(transaction);
      } catch (e) {
        console.error('[MOCK] Error sending real transaction:', e);
      }
    }
    
    // Mock transaction hash
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { 
      hash: '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      wait: async () => ({ status: 1 })
    };
  }
}

// Helper function
export const connectToMantleWithCoinbase = async (): Promise<{ account: string, provider: ethers.providers.Web3Provider | null }> => {
  try {
    const wallet = MockWalletService.getInstance({
      appName: 'Money Button'
    });
    
    const accounts = await wallet.connect();
    await wallet.switchChain(MANTLE_MAINNET_CHAIN_ID);
    
    return {
      account: accounts[0],
      provider: wallet.getProvider()
    };
  } catch (error) {
    console.error('[MOCK] Error connecting to Mantle:', error);
    throw error;
  }
};

// Type declaration to avoid TS errors
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Alias for backwards compatibility
export const CoinbaseWalletService = MockWalletService;

// Export chain constants for use elsewhere
export {
  MANTLE_MAINNET_CHAIN_ID,
  MANTLE_TESTNET_CHAIN_ID,
  MANTLE_MAINNET_RPC_URL,
  MANTLE_TESTNET_RPC_URL
}; 