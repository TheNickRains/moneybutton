'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMoneyButton } from '../providers';
import { IconWallet, IconWalletOff } from '@tabler/icons-react';

// Demo wallet address for simulation
const DEMO_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

export default function ConnectWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const { currentColorScheme } = useMoneyButton();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Dispatch custom events when connection state changes
  useEffect(() => {
    if (isConnected) {
      window.dispatchEvent(new Event('wallet-connected'));
    } else if (address) {
      window.dispatchEvent(new Event('wallet-disconnected'));
    }
  }, [isConnected, address]);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setConnectError(null);
      
      // For demo purposes, we'll simulate a wallet connection with a delay
      // In a real app, this would connect to MetaMask or another wallet
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(true);
      setAddress(DEMO_WALLET);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setConnectError("Failed to connect. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress('');
  };

  // Style based on the current Mantle color scheme
  const buttonStyles = {
    connect: {
      backgroundColor: currentColorScheme.primary,
      color: '#ffffff',
      borderColor: currentColorScheme.secondary,
    },
    disconnect: {
      backgroundColor: currentColorScheme.backgroundDark,
      color: currentColorScheme.text,
      borderColor: `${currentColorScheme.primary}50`,
    }
  };

  if (isConnected) {
    return (
      <div className="fixed top-4 right-4 flex flex-col items-end z-10">
        <motion.div 
          className="flex items-center px-3 py-1 rounded-full mb-2 text-sm"
          style={{ 
            backgroundColor: currentColorScheme.backgroundDark,
            color: currentColorScheme.text,
            border: `1px solid ${currentColorScheme.primary}30`
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <IconWallet size={14} className="mr-1" style={{ color: currentColorScheme.primary }} />
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </motion.div>
        
        <motion.button
          className="px-4 py-2 rounded-md text-sm border flex items-center"
          style={buttonStyles.disconnect}
          onClick={disconnectWallet}
          whileHover={{ 
            scale: 1.05,
            borderColor: currentColorScheme.primary
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <IconWalletOff size={16} className="mr-1" style={{ color: currentColorScheme.primary }} />
          Disconnect
        </motion.button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-10">
      <motion.button
        className="px-5 py-2.5 rounded-md font-semibold shadow-lg flex items-center"
        style={buttonStyles.connect}
        onClick={connectWallet}
        whileHover={{ 
          scale: isConnecting ? 1 : 1.05, 
          boxShadow: isConnecting ? 'none' : `0 0 15px 2px ${currentColorScheme.accent}50`
        }}
        whileTap={{ scale: isConnecting ? 1 : 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <motion.div 
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" 
              animate={{ rotate: 360 }} 
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Connecting...
          </>
        ) : (
          <>
            <IconWallet size={18} className="mr-2" />
            Connect Wallet
          </>
        )}
      </motion.button>
      {connectError && (
        <motion.div 
          className="absolute -bottom-10 left-0 right-0 text-center text-sm"
          style={{ color: currentColorScheme.accent }}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {connectError}
        </motion.div>
      )}
    </div>
  );
} 