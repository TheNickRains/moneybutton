'use client';

import { useState, useEffect } from 'react';
import MoneyButton from './components/MoneyButton';
import ConnectWallet from './components/ConnectWallet';
import ActivityFeed from './components/ActivityFeed';
import { useMoneyButton } from './providers';
import { motion, AnimatePresence } from 'framer-motion';
import { IconLink, IconInfoCircle, IconCoin, IconCurrencyDollar, IconMoon, IconSun, IconWallet, IconRobot } from '@tabler/icons-react';
import { formatPrice } from './services/chainlinkPriceFeeds';
import React from 'react';
import AIBridgeChat from './components/AIBridgeChat';

// Format large numbers for display (e.g., 1.2M, 350K)
const formatCurrencyValue = formatPrice;

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showJackpotTeaser, setShowJackpotTeaser] = useState(false);
  const { 
    currentColorScheme, 
    pot, 
    potInUSDC, 
    toggleColorTheme,
    totalContributors,
    conversionRates,
    refreshConversionRates
  } = useMoneyButton();
  
  const [showInfo, setShowInfo] = useState(false);
  const [showGlobalPotAnimation, setShowGlobalPotAnimation] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1000); // Default fallback value
  const [individualContribution, setIndividualContribution] = useState(0);
  const [individualContributionUSDC, setIndividualContributionUSDC] = useState(0);
  const [showAIBridge, setShowAIBridge] = useState(false);
  const [bridgeParams, setBridgeParams] = useState({
    currency: 'ETH',
    amount: '0.1'
  });

  // Periodically show the jackpot teaser if wallet is not connected
  useEffect(() => {
    if (!isConnected && mounted) {
      const showTeaser = () => {
        setShowJackpotTeaser(true);
        setTimeout(() => {
          setShowJackpotTeaser(false);
        }, 4000);
      };
      
      // Initial delay before first teaser
      const initialTimeout = setTimeout(showTeaser, 5000);
      
      // Set up interval for repeated teasers
      const interval = setInterval(showTeaser, 30000);
      
      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    }
  }, [isConnected, mounted]);

  // Handle child component state update
  useEffect(() => {
    // Wait for component to mount to avoid hydration errors
    setMounted(true);
    // Set window width after component mounts
    setWindowWidth(window.innerWidth);
    
    // Update window width on resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track pot changes for global animation
  useEffect(() => {
    // We're now using the individualContribution instead of tracking previousPot
    // This useEffect is kept for future use if needed
  }, [pot]);

  // Listen for the pot-increased event from MoneyButton
  useEffect(() => {
    const handlePotIncrease = (event: any) => {
      // Get the exact contribution amount from the event
      const contribution = event.detail?.amount || 0;
      const currencyType = event.detail?.currency || 'MNT';
      
      // Use the dynamic conversion rate from context
      const conversionRate = conversionRates[currencyType] || conversionRates['MNT'];
      
      // Store the exact contribution amount for display
      setIndividualContribution(contribution);
      setIndividualContributionUSDC(contribution * conversionRate);
      
      // Show the animation
      setShowGlobalPotAnimation(true);
      
      // Add a subtle pulse effect to the jackpot card
      const jackpotCard = document.querySelector('.jackpot-card');
      if (jackpotCard) {
        jackpotCard.classList.add('pulse-green');
        setTimeout(() => {
          jackpotCard.classList.remove('pulse-green');
        }, 1000);
      }
      
      // Hide the animation after a delay
      setTimeout(() => {
        setShowGlobalPotAnimation(false);
      }, 3000);
    };
    
    window.addEventListener('pot-increased', handlePotIncrease);
    
    return () => {
      window.removeEventListener('pot-increased', handlePotIncrease);
    };
  }, [conversionRates]);

  // Listen for connect wallet events
  useEffect(() => {
    const handleWalletConnect = () => {
      setIsConnected(true);
    };
    
    const handleWalletDisconnect = () => {
      setIsConnected(false);
    };
    
    window.addEventListener('wallet-connected', handleWalletConnect);
    window.addEventListener('wallet-disconnected', handleWalletDisconnect);
    
    return () => {
      window.removeEventListener('wallet-connected', handleWalletConnect);
      window.removeEventListener('wallet-disconnected', handleWalletDisconnect);
    };
  }, []);

  // Handler for bridge completion
  const handleBridgeComplete = (amount) => {
    setShowAIBridge(false);
    // Additional logic if needed
    console.log(`Bridge completed with ${amount} MNT`);
  };

  if (!mounted) {
    return null; // Avoid hydration errors by not rendering until client-side
  }

  return (
    <div 
      className="flex flex-col items-center min-h-screen text-white transition-colors duration-300"
      style={{ backgroundColor: currentColorScheme.background }}
    >
      {/* Page Title - Left-side only */}
      <div className="fixed top-4 left-4 z-10 hidden sm:block">
        <div>
          <h1 className="text-xl font-bold" style={{ color: currentColorScheme.primary }}>
            MONEY BUTTON
          </h1>
          <p className="text-xs" style={{ color: currentColorScheme.textMuted }}>
            Powered by Mantle Network
          </p>
        </div>
      </div>
      
      {/* Theme Toggle - Moved to right of the screen */}
      <div className="fixed top-4 right-20 z-10">
        <motion.button
          onClick={toggleColorTheme}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full"
          style={{ backgroundColor: `${currentColorScheme.primary}30` }}
        >
          <IconMoon size={20} color={currentColorScheme.text} />
        </motion.button>
      </div>
      
      {/* Ephemeral Jackpot Teaser Animation - Center of screen */}
      <AnimatePresence>
        {showJackpotTeaser && !isConnected && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="bg-black bg-opacity-60 backdrop-blur-sm p-6 rounded-xl flex flex-col items-center"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ 
                scale: 1, 
                y: 0,
              }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 15
              }}
            >
              <motion.div
                className="mb-2"
                animate={{ 
                  rotate: [0, 10, 0, -10, 0],
                  scale: [1, 1.2, 1, 1.2, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: 2,
                  repeatType: "reverse"
                }}
              >
                <IconCoin size={40} style={{ color: currentColorScheme.accent }} />
              </motion.div>
              
              <motion.div
                className="text-2xl font-bold mb-1"
                animate={{
                  color: [currentColorScheme.text, currentColorScheme.accent, currentColorScheme.text]
                }}
                transition={{ duration: 2, repeat: 1 }}
                style={{ color: currentColorScheme.text }}
              >
                JACKPOT: {formatCurrencyValue(pot)} MNT
              </motion.div>
              
              <motion.div 
                className="text-sm mb-4"
                style={{ color: currentColorScheme.textMuted }}
              >
                ${formatCurrencyValue(potInUSDC)} USDC
              </motion.div>
              
              <motion.div
                className="flex items-center text-sm border border-dashed py-1.5 px-3 rounded-full"
                style={{ borderColor: currentColorScheme.primary }}
                whileHover={{ scale: 1.05 }}
                animate={{ 
                  y: [0, -3, 0],
                  boxShadow: [
                    `0 0 0 rgba(${parseInt(currentColorScheme.primary.slice(1, 3), 16)}, ${parseInt(currentColorScheme.primary.slice(3, 5), 16)}, ${parseInt(currentColorScheme.primary.slice(5, 7), 16)}, 0)`,
                    `0 0 10px rgba(${parseInt(currentColorScheme.primary.slice(1, 3), 16)}, ${parseInt(currentColorScheme.primary.slice(3, 5), 16)}, ${parseInt(currentColorScheme.primary.slice(5, 7), 16)}, 0.5)`,
                    `0 0 0 rgba(${parseInt(currentColorScheme.primary.slice(1, 3), 16)}, ${parseInt(currentColorScheme.primary.slice(3, 5), 16)}, ${parseInt(currentColorScheme.primary.slice(5, 7), 16)}, 0)`
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <IconWallet size={14} style={{ color: currentColorScheme.primary }} className="mr-1" />
                <span style={{ color: currentColorScheme.text }}>Connect wallet to play</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header with wallet connection */}
      <ConnectWallet />
      
      {/* Main content - centered layout */}
      <div className="flex flex-col items-center justify-center flex-grow py-8 w-full max-w-md px-4">
        <MoneyButton isConnected={isConnected} onShowAIBridge={(currency, amount) => {
          setBridgeParams({ currency, amount });
          setShowAIBridge(true);
        }} />

        {/* Mantle Network banner */}
        <motion.div 
          className="mt-8 w-full max-w-md px-4 py-3 rounded-lg flex items-center"
          style={{ 
            backgroundColor: `${currentColorScheme.backgroundDark}`,
            borderLeft: `3px solid ${currentColorScheme.primary}`
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <IconLink size={24} style={{ color: currentColorScheme.primary }} className="mr-3" />
          <div>
            <p className="text-sm font-medium" style={{ color: currentColorScheme.text }}>
              Cross-Chain Compatible
            </p>
            <p className="text-xs opacity-80" style={{ color: currentColorScheme.textMuted }}>
              Powered by Mantle Network - bet with any token on any chain
            </p>
          </div>
        </motion.div>
        
        {/* Chainlink Price Feeds attribution */}
        <motion.div 
          className="mt-4 w-full max-w-md px-4 py-2 rounded-lg flex items-center"
          style={{ 
            backgroundColor: `${currentColorScheme.backgroundDark}`,
            borderLeft: `3px solid #375BD2` // Chainlink blue
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          <svg width="20" height="20" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3">
            <path d="M16 0L32 11V33L16 44L0 33V11L16 0Z" fill="#375BD2"/>
            <path d="M16.5 12V20.7647L24 16.8V8L16.5 12Z" fill="white"/>
            <path d="M16.5 12L9 8V16.8L16.5 20.7647V12Z" fill="white"/>
            <path d="M16.5 28.2353V20L9 16V24.2941L16.5 28.2353Z" fill="white"/>
            <path d="M16.5 28.2353L24 24.2941V16L16.5 20V28.2353Z" fill="white"/>
            <path d="M16.5 36V28.2353L9 24.2941V32L16.5 36Z" fill="white"/>
            <path d="M16.5 36L24 32V24.2941L16.5 28.2353V36Z" fill="white"/>
          </svg>
          <div>
            <p className="text-sm font-medium" style={{ color: currentColorScheme.text }}>
              Price Feeds
            </p>
            <p className="text-xs opacity-80" style={{ color: currentColorScheme.textMuted }}>
              Powered by Chainlink Oracle Network
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="w-full text-center py-4 text-xs" style={{ color: currentColorScheme.textMuted }}>
        Powered by Mantle Network, Wormhole & Chainlink
      </div>
      
      {/* Activity Feed - Moved to bottom left */}
      <div className="fixed bottom-4 left-4 z-10 max-w-xs max-h-48 overflow-hidden">
        <ActivityFeed colorScheme={currentColorScheme} />
      </div>
      
      {/* Permanent Jackpot Modal in Bottom Right */}
      <motion.div 
        className="fixed bottom-4 right-4 p-3 rounded-lg flex flex-col items-center z-10 jackpot-card"
        style={{ 
          backgroundColor: `${currentColorScheme.backgroundDark}90`,
          border: `1px solid ${currentColorScheme.primary}30`,
          backdropFilter: 'blur(8px)'
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.03 }}
      >
        <div className="flex items-center justify-center w-full mb-1.5">
          <motion.div
            animate={{ 
              rotate: [0, 5, 0, -5, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <IconCoin size={20} style={{ color: currentColorScheme.accent }} className="mr-2" />
          </motion.div>
          <div className="flex items-center">
            <motion.span 
              className="font-bold text-sm"
              animate={{
                color: showGlobalPotAnimation 
                  ? [currentColorScheme.text, "#4ade80", currentColorScheme.text] 
                  : currentColorScheme.text
              }}
              transition={{ duration: showGlobalPotAnimation ? 2 : 5, repeat: showGlobalPotAnimation ? 0 : Infinity }}
              style={{ color: currentColorScheme.text }}
            >
              {formatCurrencyValue(pot)} MNT
            </motion.span>
            
            {/* Pot increase indicator */}
            <AnimatePresence>
              {showGlobalPotAnimation && (
                <motion.span
                  className="ml-1.5 text-xs font-medium"
                  style={{ color: "#4ade80" }}
                  initial={{ opacity: 0, y: 5, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  +{formatCurrencyValue(individualContribution)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex items-center justify-center w-full">
          <motion.span 
            className="text-xs"
            style={{ color: currentColorScheme.textMuted }}
            animate={{
              color: showGlobalPotAnimation 
                ? [currentColorScheme.textMuted, "#4ade80", currentColorScheme.textMuted] 
                : currentColorScheme.textMuted
            }}
            transition={{ duration: showGlobalPotAnimation ? 2 : 5 }}
          >
            <IconCurrencyDollar size={10} className="inline mr-0.5" />
            ${formatCurrencyValue(potInUSDC)} USDC
          </motion.span>
          
            {/* USDC increase indicator */}
            <AnimatePresence>
              {showGlobalPotAnimation && (
                <motion.span
                  className="ml-1 text-xs font-medium"
                  style={{ color: "#4ade80" }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  +${formatCurrencyValue(individualContributionUSDC)}
                </motion.span>
              )}
            </AnimatePresence>
        </div>
        
        {/* Participants count */}
        <div className="flex items-center justify-center w-full mt-2 border-t border-gray-800 pt-1.5">
          <div className="bg-green-500 w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"></div>
          <span className="text-xs" style={{ color: currentColorScheme.textMuted }}>
            {totalContributors} active players
          </span>
        </div>
        
        {!isConnected && (
          <motion.div
            className="flex items-center text-xs border border-dashed py-1 px-2 rounded-full mt-1 w-full justify-center"
            style={{ borderColor: `${currentColorScheme.primary}60` }}
            animate={{ 
              y: [0, -2, 0],
              boxShadow: [
                `0 0 0 rgba(${parseInt(currentColorScheme.primary.slice(1, 3), 16)}, ${parseInt(currentColorScheme.primary.slice(3, 5), 16)}, ${parseInt(currentColorScheme.primary.slice(5, 7), 16)}, 0)`,
                `0 0 8px rgba(${parseInt(currentColorScheme.primary.slice(1, 3), 16)}, ${parseInt(currentColorScheme.primary.slice(3, 5), 16)}, ${parseInt(currentColorScheme.primary.slice(5, 7), 16)}, 0.3)`,
                `0 0 0 rgba(${parseInt(currentColorScheme.primary.slice(1, 3), 16)}, ${parseInt(currentColorScheme.primary.slice(3, 5), 16)}, ${parseInt(currentColorScheme.primary.slice(5, 7), 16)}, 0)`
              ]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <IconWallet size={10} style={{ color: currentColorScheme.primary }} className="mr-1" />
            <span style={{ color: currentColorScheme.text }}>Connect to play</span>
          </motion.div>
        )}
      </motion.div>

      {/* AI Bridge Chat */}
      <AIBridgeChat
        isOpen={showAIBridge}
        onClose={() => setShowAIBridge(false)}
        onComplete={handleBridgeComplete}
        initialCurrency={bridgeParams.currency}
        initialAmount={bridgeParams.amount}
      />
    </div>
  );
}
