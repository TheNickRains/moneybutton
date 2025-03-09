import { useState, useCallback } from 'react';
import { SourceChain, universalBridgeService } from '../../../services/universalBridgeService';

/**
 * Custom hook to manage wallet connection state and operations
 */
export function useWallet() {
  const [selectedChain, setSelectedChain] = useState<SourceChain | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletError, setWalletError] = useState<string | null>(null);

  /**
   * Connect wallet to selected chain
   * @param chain - Chain to connect to
   * @returns Promise that resolves when connection attempt completes
   */
  const connectWallet = useCallback(async (chain: SourceChain) => {
    setWalletError(null);
    
    try {
      const address = await universalBridgeService.connectWallet(chain);
      
      if (address) {
        setWalletConnected(true);
        setWalletAddress(address);
        return address;
      } else {
        setWalletError('Failed to connect wallet. Please try again.');
        return null;
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setWalletError(error instanceof Error ? error.message : 'Unknown error connecting wallet');
      return null;
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    universalBridgeService.disconnectWallet();
    setWalletConnected(false);
    setWalletAddress('');
  }, []);

  return {
    selectedChain,
    setSelectedChain,
    walletConnected,
    walletAddress,
    walletError,
    connectWallet,
    disconnectWallet
  };
} 