import { useState, useCallback, useEffect, ReactNode } from 'react';
import { SourceChain, BridgeStatus } from '../../../services/universalBridgeService';
import { universalBridgeService } from '../../../services/universalBridgeService';

/**
 * Custom hook to manage the token bridging process, including token selection and amount input
 * 
 * @param selectedChain - Currently selected source chain
 * @param walletConnected - Whether wallet is connected
 * @param walletAddress - Connected wallet address
 * @param addAIMessage - Function to add AI messages to chat
 * @param addSystemMessage - Function to add system messages to chat
 * @param onComplete - Callback to run when bridging completes
 */
export function useBridgeProcess(
  selectedChain: SourceChain | null,
  walletConnected: boolean,
  walletAddress: string,
  addAIMessage: (content: string | ReactNode) => void,
  addSystemMessage: (content: string | ReactNode) => void,
  onComplete: (result: { success: boolean; amount: string; token: string }) => void
) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [bridgeAmount, setBridgeAmount] = useState<string>('');
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [isBridging, setIsBridging] = useState(false);
  
  // Reset token state when chain changes
  useEffect(() => {
    setSelectedToken(null);
    setBridgeAmount('');
    setTokenBalance(null);
  }, [selectedChain]);
  
  // Fetch token balance when token is selected
  useEffect(() => {
    if (selectedChain && selectedToken && walletConnected) {
      fetchBalance();
    }
  }, [selectedChain, selectedToken, walletConnected, walletAddress]);
  
  // Get chain name for display
  const getChainName = (chain: SourceChain): string => {
    const chainNames: Record<SourceChain, string> = {
      [SourceChain.ETHEREUM]: 'Ethereum',
      [SourceChain.BINANCE]: 'BNB Chain',
      [SourceChain.POLYGON]: 'Polygon',
      [SourceChain.AVALANCHE]: 'Avalanche',
      [SourceChain.ARBITRUM]: 'Arbitrum',
      [SourceChain.OPTIMISM]: 'Optimism',
      [SourceChain.SOLANA]: 'Solana',
      [SourceChain.BASE]: 'Base',
      [SourceChain.MANTLE]: 'Mantle'
    };
    return chainNames[chain];
  };
  
  // Get chain explorer URL
  const getChainExplorer = (chain: SourceChain): string => {
    const explorers: Record<SourceChain, string> = {
      [SourceChain.ETHEREUM]: 'https://etherscan.io',
      [SourceChain.BINANCE]: 'https://bscscan.com',
      [SourceChain.POLYGON]: 'https://polygonscan.com',
      [SourceChain.AVALANCHE]: 'https://snowtrace.io',
      [SourceChain.ARBITRUM]: 'https://arbiscan.io',
      [SourceChain.OPTIMISM]: 'https://optimistic.etherscan.io',
      [SourceChain.SOLANA]: 'https://explorer.solana.com',
      [SourceChain.BASE]: 'https://basescan.org',
      [SourceChain.MANTLE]: 'https://explorer.mantle.xyz'
    };
    return explorers[chain];
  };
  
  /**
   * Fetch token balance for selected token
   */
  const fetchBalance = useCallback(async () => {
    if (!selectedChain || !selectedToken || !walletConnected) return;
    
    try {
      // In a real app, this would be an actual balance query
      // Since universalBridgeService.getTokenBalance only accepts one parameter, 
      // we'll use a mock balance for this example
      const balance = await universalBridgeService.getTokenBalance(selectedToken);
      
      setTokenBalance(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setTokenBalance('0');
    }
  }, [selectedChain, selectedToken, walletConnected, walletAddress]);
  
  /**
   * Handle token selection
   * @param token - Selected token symbol
   */
  const handleTokenSelection = useCallback((token: string) => {
    setSelectedToken(token);
    
    // Add message about token selection
    addSystemMessage(`Selected token: ${token}`);
    
    // Notification that would normally trigger UI updates but without JSX
    addAIMessage(`Great! You've selected ${token}. How much would you like to bridge to Mantle Network?`);
  }, [addAIMessage, addSystemMessage]);
  
  /**
   * Set maximum amount based on balance
   */
  const handleMax = useCallback(() => {
    if (tokenBalance) {
      setBridgeAmount(tokenBalance);
    }
  }, [tokenBalance]);
  
  /**
   * Handle amount confirmation
   */
  const handleAmountConfirmation = useCallback(() => {
    if (!selectedChain || !selectedToken || !bridgeAmount) return;
    
    const amount = parseFloat(bridgeAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    // Add message about amount confirmation
    addSystemMessage(`Amount confirmed: ${bridgeAmount} ${selectedToken}`);
    
    // Display confirmation message without JSX
    if (selectedChain) {
      addAIMessage(`You're about to bridge ${bridgeAmount} ${selectedToken} from ${getChainName(selectedChain)} to Mantle Network.`);
    } else {
      addAIMessage(`You're about to bridge ${bridgeAmount} ${selectedToken} to Mantle Network.`);
    }
  }, [selectedChain, selectedToken, bridgeAmount, addAIMessage, addSystemMessage]);
  
  /**
   * Handle bridge status changes
   * @param status - New bridge status
   * @param txId - Transaction ID
   */
  const handleBridgeStatusChange = useCallback((status: BridgeStatus, txId: string) => {
    if (!selectedChain) return;
    
    const chainExplorer = getChainExplorer(selectedChain);
    const txUrl = `${chainExplorer}/tx/${txId}`;
    
    if (status === BridgeStatus.COMPLETED) {
      // Show success message
      addAIMessage(`Bridge transaction completed successfully! Your ${bridgeAmount} ${selectedToken} has been bridged to Mantle Network. Transaction ID: ${txId.substring(0, 8)}...${txId.substring(txId.length - 6)}`);
    } else if (status === BridgeStatus.PENDING) {
      // Show pending message
      addAIMessage(`Bridge transaction in progress. Your transaction has been submitted and is being processed. Transaction ID: ${txId.substring(0, 8)}...${txId.substring(txId.length - 6)}`);
    } else if (status === BridgeStatus.FAILED) {
      // Show failure message
      addAIMessage(`Bridge transaction failed. I'm sorry, but your bridge transaction could not be completed. Transaction ID: ${txId.substring(0, 8)}...${txId.substring(txId.length - 6)}`);
    }
  }, [selectedChain, bridgeAmount, selectedToken, addAIMessage]);
  
  /**
   * Start the bridging process
   */
  const startBridgeProcess = useCallback(async () => {
    if (!selectedChain || !selectedToken || !bridgeAmount || !walletConnected) return;
    
    setIsBridging(true);
    
    // Add message about starting the bridge
    addSystemMessage(`Initiating bridge of ${bridgeAmount} ${selectedToken} from ${getChainName(selectedChain)} to Mantle Network`);
    
    // Show processing message
    const processingMessageId = `processing-${Date.now()}`;
    addAIMessage(`Processing your bridge transaction... Please confirm the transaction in your wallet when prompted.`);
    
    try {
      // Create transaction ID for tracking
      const txId = `bridge-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Register callback for status updates
      const handleBridgeUpdate = (status: BridgeStatus, id: string) => {
        handleBridgeStatusChange(status, id);
      };
      
      // Attempt to bridge tokens using universalBridgeService
      const bridgeTransaction = await universalBridgeService.bridgeTokens(
        selectedChain,
        selectedToken,
        bridgeAmount,
        handleBridgeUpdate
      );
      
      // Check the final status of the transaction
      if (bridgeTransaction.status === BridgeStatus.COMPLETED) {
        onComplete({
          success: true,
          amount: bridgeAmount,
          token: selectedToken
        });
      } else if (bridgeTransaction.status === BridgeStatus.FAILED) {
        onComplete({
          success: false,
          amount: bridgeAmount,
          token: selectedToken
        });
      } else {
        // Transaction is still processing
        addAIMessage(`Your bridge transaction is being processed. You can check its status in the transaction history.`);
      }
    } catch (error) {
      console.error('Bridge error:', error);
      
      // Handle error
      addAIMessage(`I encountered an error while trying to process your bridge transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      onComplete({
        success: false,
        amount: bridgeAmount,
        token: selectedToken
      });
    } finally {
      setIsBridging(false);
    }
  }, [selectedChain, selectedToken, bridgeAmount, walletConnected, walletAddress, addAIMessage, addSystemMessage, onComplete]);
  
  return {
    selectedToken,
    setSelectedToken,
    bridgeAmount,
    setBridgeAmount,
    tokenBalance,
    isBridging,
    handleTokenSelection,
    handleMax,
    handleAmountConfirmation,
    startBridgeProcess
  };
} 