'use client';

import { useState, useEffect } from 'react';
import MoneyButton from './components/MoneyButton';
import ConnectWallet from './components/ConnectWallet';
import ActivityFeed from './components/ActivityFeed';
import { useMoneyButton } from './providers';
import { motion, AnimatePresence } from 'framer-motion';
import { IconLink, IconInfoCircle, IconCoin, IconCurrencyDollar, IconMoon, IconSun, IconWallet, IconRobot, IconActivity, IconRefresh } from '@tabler/icons-react';
import { formatPrice } from './services/chainlinkPriceFeeds';
import React from 'react';
import AgentBridge from './components/AgentBridge/index';

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
    refreshConversionRates,
    isWalletConnected,
    walletAddress,
    mntBalance,
    setMntBalance
  } = useMoneyButton();
  
  const [showInfo, setShowInfo] = useState(false);
  const [showGlobalPotAnimation, setShowGlobalPotAnimation] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1000); // Default fallback value
  const [individualContribution, setIndividualContribution] = useState(0);
  const [individualContributionUSDC, setIndividualContributionUSDC] = useState(0);
  const [activeTab, setActiveTab] = useState('button'); // 'button' or 'bridge'
  const [showBridge, setShowBridge] = useState(false);

  // Update isConnected state when wallet connection changes
  useEffect(() => {
    setIsConnected(isWalletConnected);
  }, [isWalletConnected]);

  // Set mounted state on component mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle bridge completion
  const handleBridgeComplete = (result: { success: boolean; amount: string; token: string }) => {
    if (result && result.success) {
      // Update the user's MNT balance
      const currentBalance = parseFloat(mntBalance || '0');
      const addedAmount = parseFloat(result.amount) || 1.0;
      setMntBalance((currentBalance + addedAmount).toFixed(2));
      
      // Close bridge modal and switch to button tab
      setShowBridge(false);
      setActiveTab('button');
    }
  };

  return (
    <main className={`flex h-full flex-col items-center p-2 md:p-4 lg:p-6 ${currentColorScheme.background} overflow-hidden relative`}>
      {/* Header section */}
      <div className="w-full max-w-5xl flex flex-col items-center z-10">
        <div className="w-full flex justify-between items-center mb-2 md:mb-4">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-blue-500">MONEY BUTTON</h1>
            <p className="text-xs md:text-sm text-gray-400">Powered by Mantle Network</p>
          </div>
          
          {/* Connect Wallet Button (always visible in header) */}
          <div>
            <button
              onClick={() => window.dispatchEvent(new Event('wallet-connect-requested'))}
              className={`px-2 md:px-4 py-1 md:py-2 rounded-lg ${isConnected ? 'bg-green-600' : 'bg-blue-600'} text-white font-medium flex items-center space-x-2 text-sm md:text-base`}
            >
              <IconWallet size={16} className="mr-1 md:mr-2" />
              <span>{isConnected ? 'Wallet Connected' : 'Connect Wallet'}</span>
            </button>
          </div>
        </div>
        
        {/* Tab Navigation - Always visible */}
        <div className="w-full max-w-md mb-2 md:mb-4 flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('button')}
            className={`flex-1 py-2 text-center font-medium ${activeTab === 'button' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'} text-sm md:text-base`}
          >
            Money Button
          </button>
          <button
            onClick={() => setActiveTab('bridge')}
            className={`flex-1 py-2 text-center font-medium ${activeTab === 'bridge' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'} text-sm md:text-base`}
          >
            Bridge to MNT
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="w-full max-w-md">
          {activeTab === 'button' ? (
            <MoneyButton onShowAIBridge={(currency, amount) => {
              setActiveTab('bridge');
              setShowBridge(true);
            }} />
          ) : (
            <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-white">Universal Bridge to MNT</h2>
              <p className="text-gray-400 mb-6">
                Our agentic bridge assistant can help you convert tokens from any supported chain to MNT on Mantle Network.
              </p>
              {isConnected ? (
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setShowBridge(true)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors"
                  >
                    <IconRobot size={20} className="mr-2" />
                    Launch Bridge Assistant
                  </button>
                  
                  <div className="mt-8 grid grid-cols-3 gap-3 w-full">
                    <div className="bg-gray-800 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-400">From</p>
                      <p className="text-sm font-medium text-white">8 Chains</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-400">Tokens</p>
                      <p className="text-sm font-medium text-white">4+ Types</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-400">To</p>
                      <p className="text-sm font-medium text-white">Mantle</p>
                    </div>
                  </div>
                  
                  <p className="mt-6 text-center text-sm text-gray-500">
                    Secure cross-chain bridging with transaction tracking and support for multiple tokens.
                  </p>
                  
                  {/* Universal Bridge Component */}
                  <AgentBridge 
                    isOpen={showBridge}
                    onClose={() => setShowBridge(false)}
                    onComplete={handleBridgeComplete}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconWallet size={32} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-300 mb-4">Connect your wallet to use the universal bridge</p>
                  <button
                    onClick={() => window.dispatchEvent(new Event('wallet-connect-requested'))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Psychological Triggers Section - Subtly visible around the button */}
      <div className="fixed inset-0 pointer-events-none z-20 flex items-center justify-center">
        <div className="relative w-full max-w-md">
          {/* FOMO Trigger - Shows random bets to create urgency */}
          <AnimatePresence>
            {showGlobalPotAnimation && (
              <motion.div 
                className="absolute top-1/4 -right-8 transform -translate-y-1/2 bg-indigo-900/50 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-2 max-w-[180px]"
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <div className="text-xs text-indigo-200 font-medium">
                  <span className="text-white">3 users</span> bet in the last minute!
                </div>
                <div className="text-[10px] text-gray-300 mt-1">
                  The pot keeps growing. Don't miss out!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Near-Miss Effect - Shows "almost won" messages */}
          <AnimatePresence>
            {individualContribution > 0 && Math.random() > 0.7 && (
              <motion.div 
                className="absolute bottom-1/4 -left-8 transform translate-y-1/2 bg-purple-900/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-2 max-w-[180px]"
                initial={{ opacity: 0, x: -50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <div className="text-xs text-purple-200 font-medium">
                  So close! You almost won with your last bet.
                </div>
                <div className="text-[10px] text-gray-300 mt-1">
                  Try again, your chances increase with each bet!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Recent Win Flash - Creates excitement */}
      <AnimatePresence>
        {showJackpotTeaser && (
          <motion.div 
            className="fixed top-20 inset-x-0 flex justify-center items-center pointer-events-none z-30"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-green-900/70 backdrop-blur-sm border border-green-500/50 rounded-lg px-4 py-2 shadow-lg text-center">
              <div className="text-sm font-bold text-white">
                <span className="text-green-300">User_5678</span> just won <span className="text-green-300">10.000 MNT!</span>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                The pot has been reset. Be the first to contribute!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Players Counter - Creates social proof */}
      <div className="absolute bottom-4 right-4 bg-gray-900/80 rounded-lg border border-gray-800 p-2 z-20">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
          <span className="text-xs text-gray-300">{totalContributors} active players</span>
        </div>
      </div>
      
      {/* Cross-Chain Compatible Footer - Updated messaging */}
      <div className="w-full max-w-md mt-auto pt-2 p-2 md:p-3 bg-gray-900 rounded-lg border border-gray-800 text-xs md:text-sm mb-1">
        <div className="flex items-center mb-1">
          <IconLink size={14} className="text-blue-500 mr-1 md:mr-2" />
          <h3 className="text-white font-medium">Universal Bridge Support</h3>
        </div>
        <p className="text-gray-400 text-xs">
          Powered by Wormhole - Bridge from 8+ chains and multiple token types to MNT
        </p>
        <div className="mt-1 text-xs text-gray-500 flex justify-between">
          <span>Chainlink Oracle Network</span>
          <span>⚡ Mantle Network</span>
        </div>
      </div>

      {/* Universal Bridge Component */}
      <AgentBridge 
        isOpen={showBridge}
        onClose={() => setShowBridge(false)}
        onComplete={handleBridgeComplete}
      />
    </main>
  );
}
