import React from 'react';
import { WalletConnectionProps } from '../types';
import { IconWallet, IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import ChainIcon from '../../ChainIcon';

/**
 * Component to handle wallet connection UI and state
 */
const WalletConnection: React.FC<WalletConnectionProps> = ({
  chain,
  onConnect,
  isConnected,
  walletAddress,
  error
}) => {
  if (isConnected && walletAddress) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center mr-3">
              <IconCheck size={16} className="text-green-400" />
            </div>
            <span className="font-medium">Wallet Connected</span>
          </div>
          <div className="flex items-center bg-gray-700 rounded-full px-3 py-1">
            <ChainIcon chain={chain} size="sm" className="mr-1.5" />
            <span className="text-xs">{chain}</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>Address:</span>
          <span className="font-mono bg-gray-900 px-2 py-1 rounded">
            {formatAddress(walletAddress)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex flex-col">
        <div className="flex items-center mb-3">
          <IconWallet size={20} className="mr-2 text-gray-400" />
          <span className="font-medium">Connect Wallet</span>
        </div>
        
        <button
          onClick={onConnect}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
        >
          <div className="flex items-center">
            <IconWallet className="mr-2" size={18} />
            <span className="mr-2">Connect to</span>
            <ChainIcon chain={chain} size="sm" className="mr-1.5" />
            <span>{chain}</span>
          </div>
        </button>
        
        {error && (
          <div className="mt-3 text-red-400 text-sm flex items-start">
            <IconAlertTriangle size={16} className="mr-1 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
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

export default WalletConnection; 