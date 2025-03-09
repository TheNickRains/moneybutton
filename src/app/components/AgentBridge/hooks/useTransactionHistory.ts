import { useState, useEffect, useCallback } from 'react';
import { BridgeTransaction } from '../../../services/universalBridgeService';
import { universalBridgeService } from '../../../services/universalBridgeService';

/**
 * Custom hook to manage transaction history state and operations
 */
export function useTransactionHistory() {
  const [transactionHistory, setTransactionHistory] = useState<BridgeTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Load transaction history on hook mount
  useEffect(() => {
    const transactions = universalBridgeService.getTransactions();
    setTransactionHistory(transactions);
    
    // Optional: Set up a listener for new transactions
    const intervalId = setInterval(() => {
      const latestTransactions = universalBridgeService.getTransactions();
      setTransactionHistory(latestTransactions);
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  /**
   * Toggle transaction history visibility
   */
  const toggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);
  
  /**
   * Refresh transaction history on demand
   */
  const refreshHistory = useCallback(() => {
    const transactions = universalBridgeService.getTransactions();
    setTransactionHistory(transactions);
  }, []);
  
  return {
    transactionHistory,
    showHistory,
    toggleHistory,
    refreshHistory
  };
} 