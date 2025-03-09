import React from 'react';
import { TransactionHistoryProps } from '../types';
import { BridgeStatus, BridgeTransaction, SourceChain } from '../../../services/universalBridgeService';
import { IconHistory } from '@tabler/icons-react';
import ChainIcon from '../../ChainIcon';
import TokenIcon from '../../TokenIcon';

/**
 * Component to render a list of past bridge transactions
 */
const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  isVisible, 
  transactions 
}) => {
  if (!isVisible) {
    return (
      <IconHistory size={18} />
    );
  }

  /**
   * Get appropriate badge color based on transaction status
   * @param status - Bridge transaction status
   * @returns CSS class for badge color
   */
  const getBadgeColor = (status: BridgeStatus): string => {
    switch (status) {
      case BridgeStatus.COMPLETED:
        return 'bg-green-900 text-green-300';
      case BridgeStatus.PENDING:
        return 'bg-yellow-900 text-yellow-300';
      case BridgeStatus.FAILED:
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  /**
   * Format a timestamp for display
   * @param timestamp - Date to format
   * @returns Formatted date string
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Format a wallet address for display
   * @param address - Wallet address
   * @returns Shortened address with ellipsis
   */
  const formatAddress = (address: string): string => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <div className="absolute right-0 top-10 w-80 bg-gray-900 shadow-lg rounded-lg border border-gray-800 overflow-hidden z-10">
      <div className="p-3 border-b border-gray-800 bg-gray-800 flex justify-between items-center">
        <h3 className="font-medium">Transaction History</h3>
        <span className="text-xs text-gray-400">{transactions.length} transactions</span>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-3 hover:bg-gray-800 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <TokenIcon token={tx.sourceToken} size="sm" className="mr-1.5" />
                    <span className="font-medium">{tx.sourceToken}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
                  <span>Amount:</span>
                  <span className="text-right text-white">{tx.amount}</span>
                  
                  <span>From:</span>
                  <span className="text-right flex items-center justify-end">
                    <ChainIcon chain={tx.sourceChain as SourceChain} size="sm" className="mr-1" />
                    {tx.sourceChain}
                  </span>
                  
                  <span>To:</span>
                  <span className="text-right flex items-center justify-end">
                    <ChainIcon chain={tx.destinationChain as SourceChain} size="sm" className="mr-1" />
                    {tx.destinationChain}
                  </span>
                  
                  <span>Address:</span>
                  <span className="text-right truncate" title={tx.userAddress}>
                    {formatAddress(tx.userAddress)}
                  </span>
                  
                  <span>Date:</span>
                  <span className="text-right">{formatDate(tx.timestamp)}</span>
                </div>
                
                {tx.txHash && (
                  <div className="mt-2 text-xs">
                    <a 
                      href={`https://explorer.mantle.xyz/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 truncate"
                    >
                      View on Explorer
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory; 