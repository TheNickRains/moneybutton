'use client';

import React, { useState, useEffect } from 'react';
import { IconWallet, IconLogout, IconChevronDown, IconCheck, IconUserCircle } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMoneyButton } from '../providers';
import { CoinbaseWalletService, MANTLE_MAINNET_CHAIN_ID } from '../services/coinbaseWalletService';
import ChainIcon from './ChainIcon';
import { SourceChain } from '../services/universalBridgeService';

interface ConnectWalletProps {
  className?: string;
}

export default function ConnectWallet({ className = '' }: ConnectWalletProps) {
  const { isWalletConnected, walletAddress, mntBalance } = useMoneyButton();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize the wallet service
  useEffect(() => {
    // Initialize the service but don't do anything else yet
    CoinbaseWalletService.getInstance({
      appName: 'Money Button'
    });
  }, []);

  // Handle wallet connection
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      const walletService = CoinbaseWalletService.getInstance({
        appName: 'Money Button'
      });

      // Connect to wallet
      await walletService.connect();

      // Try to switch to Mantle Network
      try {
        await walletService.switchChain(MANTLE_MAINNET_CHAIN_ID);
      } catch (chainError) {
        console.error('Unable to switch to Mantle Network:', chainError);
        // Continue - user can still use the app with warnings
      }

      // Dispatch an event for the rest of the app to know the wallet is connected
      window.dispatchEvent(new CustomEvent('wallet-connected', {
        detail: {
          address: walletService.getAccount(),
          provider: walletService.getProvider()
        }
      }));

      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setConnectionError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      const walletService = CoinbaseWalletService.getInstance({
        appName: 'Money Button'
      });

      await walletService.disconnect();

      // Dispatch an event for the rest of the app to know the wallet is disconnected
      window.dispatchEvent(new CustomEvent('wallet-disconnected'));

      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Format wallet address for display
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className={`relative ${className}`}>
      {isWalletConnected ? (
        // Connected wallet UI
        <div className="flex items-center">
          <button
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 hover:border-indigo-500/50 text-white"
            onClick={() => setIsDropdownOpen(prev => !prev)}
          >
            <IconUserCircle size={16} className="text-indigo-400" />
            <span className="font-medium text-sm">{formatAddress(walletAddress)}</span>
            <IconChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Wallet Balance Pill */}
          <div className="ml-2 px-3 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-500/30 flex items-center space-x-1.5">
            <IconWallet size={14} className="text-indigo-400" />
            <span className="font-medium text-sm text-white">{mntBalance} MNT</span>
          </div>
        </div>
      ) : (
        // Connect button
        <button
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <IconWallet size={16} />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      )}

      {/* Error message */}
      {connectionError && (
        <div className="absolute top-full left-0 mt-2 w-full bg-red-800/80 text-white text-xs p-2 rounded-md">
          {connectionError}
        </div>
      )}

      {/* Dropdown menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            className="absolute top-full right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 border border-gray-700 divide-y divide-gray-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="py-1">
              <div className="px-4 py-2 flex items-center">
                <ChainIcon chain={SourceChain.MANTLE} size="sm" className="mr-2" />
                <p className="text-xs text-gray-400">Connected to Mantle</p>
              </div>
              <div className="px-4 py-1 flex items-center space-x-1 text-sm">
                <IconCheck size={14} className="text-green-500" />
                <span className="text-green-500">Active</span>
              </div>
            </div>
            <div className="py-1">
              <button
                className="w-full text-left block px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                onClick={handleDisconnect}
              >
                <span className="flex items-center">
                  <IconLogout size={14} className="mr-2" />
                  Disconnect Wallet
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 