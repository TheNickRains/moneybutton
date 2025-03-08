'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMoneyButton } from '../providers';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowDown, IconArrowUp, IconChevronRight, IconCoin, IconWallet, IconCurrencyDollar, IconCurrencyEthereum, IconCurrencyBitcoin, IconChevronDown } from '@tabler/icons-react';
import { ethers } from 'ethers';
import { CHAINLINK_PRICE_FEEDS } from '../constants/chainlink';
import BetContractABI from '../contracts/BetContract.json';
import { MessageType } from '../services/aiService';

// Sample message types for AI interaction
const MESSAGE_TYPES: ('fomo' | 'greed' | 'urgency' | 'reward' | 'social')[] = [
  'fomo', 'greed', 'urgency', 'reward', 'social'
];

// Demo wallet address for simulation
const DEMO_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

// Base win rate used for calculations
const BASE_WIN_RATE = 0.0001; // 0.01% chance to win (lottery-like odds)

// Supported currencies with their respective networks
const SUPPORTED_CURRENCIES = [
  { symbol: 'MNT', name: 'Mantle', chain: 'Mantle Network', needsBridge: false },
  { symbol: 'USDC', name: 'USD Coin', chain: 'Multiple', needsBridge: true },
  { symbol: 'ETH', name: 'Ethereum', chain: 'Ethereum', needsBridge: true },
  { symbol: 'MATIC', name: 'Polygon', chain: 'Polygon', needsBridge: true },
  { symbol: 'BNB', name: 'Binance Coin', chain: 'BNB Chain', needsBridge: true },
  { symbol: 'SOL', name: 'Solana', chain: 'Solana', needsBridge: true },
  { symbol: 'AVAX', name: 'Avalanche', chain: 'Avalanche', needsBridge: true },
  { symbol: 'ARB', name: 'Arbitrum', chain: 'Arbitrum', needsBridge: true },
  { symbol: 'OP', name: 'Optimism', chain: 'Optimism', needsBridge: true },
  { symbol: 'NEAR', name: 'Near', chain: 'Near Protocol', needsBridge: true }
];

// Currency icons mapping
const CURRENCY_ICONS: Record<string, React.ReactElement> = {
  'MNT': <IconCoin size={16} />,
  'USDC': <IconCurrencyDollar size={16} />,
  'ETH': <IconCurrencyEthereum size={16} />,
  'MATIC': <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold">P</div>,
  'BNB': <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-[10px] font-bold">B</div>,
  'SOL': <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-600 to-green-400 flex items-center justify-center text-white text-[10px] font-bold">S</div>,
  'AVAX': <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">A</div>,
  'ARB': <div className="w-4 h-4 rounded-full bg-blue-700 flex items-center justify-center text-white text-[10px] font-bold">A</div>,
  'OP': <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-bold">O</div>,
  'NEAR': <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold">N</div>
};

// Particle animation for pot growth
const PotParticleEffect = ({ color, x, y }: { color: string, x: number, y: number }) => {
  const randomX = x + (Math.random() * 60) - 30;
  const randomY = y - (30 + Math.random() * 60);
  
  return (
    <motion.div
      className="absolute text-xl font-bold z-10"
      initial={{ 
        x: x, 
        y: y,
        opacity: 0.8,
        scale: 0.5
      }}
      animate={{ 
        x: randomX, 
        y: randomY,
        opacity: 0,
        scale: 1.5
      }}
      transition={{ 
        duration: 1.5,
        ease: "easeOut"
      }}
      style={{ color }}
    >
      +
    </motion.div>
  );
};

// Format large numbers for display (e.g., 1.2M, 350K)
const formatCurrencyValue = (value: number, decimals = 2): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  } else {
    return value.toFixed(decimals);
  }
};

// Add BridgeStatus component
const BridgeStatus = ({ 
  status, 
  txHash, 
  currency, 
  amount,
  onRetry,
  style
}: { 
  status: 'idle' | 'pending' | 'completed' | 'failed', 
  txHash: string | null,
  currency: string,
  amount: string,
  onRetry: () => void,
  style?: any
}) => {
  const { currentColorScheme } = useMoneyButton();
  
  // Get selected currency details
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.symbol === currency);
  
  const getBgColor = () => {
    switch (status) {
      case 'pending': return `${currentColorScheme.secondary}30`;
      case 'completed': return `${currentColorScheme.accent}20`;
      case 'failed': return `${currentColorScheme.primary}20`;
      default: return 'transparent';
    }
  };
  
  if (status === 'idle') return null;
  
  return (
    <motion.div
      className="rounded-lg p-4 mb-4 max-w-full"
      style={{
        backgroundColor: getBgColor(),
        border: `1px solid ${currentColorScheme.text}20`,
        ...style
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color: currentColorScheme.text }}>
          {status === 'pending' && 'Cross-Chain Bridge: In Progress'}
          {status === 'completed' && 'Cross-Chain Bridge: Completed'}
          {status === 'failed' && 'Cross-Chain Bridge: Failed'}
        </span>
        {status === 'pending' && (
          <div className="flex items-center">
            <motion.div
              className="h-2 w-2 rounded-full mr-1"
              style={{ backgroundColor: currentColorScheme.secondary }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="h-2 w-2 rounded-full mr-1"
              style={{ backgroundColor: currentColorScheme.secondary }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, delay: 0.3, repeat: Infinity }}
            />
            <motion.div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: currentColorScheme.secondary }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, delay: 0.6, repeat: Infinity }}
            />
          </div>
        )}
      </div>
      
      <div className="text-xs" style={{ color: currentColorScheme.textMuted }}>
        {currencyInfo && (
          <div className="mb-1">
            Bridging {amount} {currency} from {currencyInfo.chain} to Mantle Network
          </div>
        )}
        
        {txHash && (
          <div className="truncate">
            Transaction: <span style={{ color: currentColorScheme.accent }}>{txHash}</span>
          </div>
        )}
      </div>
      
      {status === 'failed' && (
        <button
          className="mt-2 px-3 py-1 text-xs rounded-lg"
          style={{ 
            backgroundColor: currentColorScheme.primary,
            color: '#fff'
          }}
          onClick={onRetry}
        >
          Retry Bridge
        </button>
      )}
    </motion.div>
  );
};

// Add to props
interface MoneyButtonProps {
  onShowAIBridge?: (currency: string, amount: string) => void;
}

export default function MoneyButton({ onShowAIBridge }: MoneyButtonProps) {
  const { 
    pot, 
    potInUSDC,
    buttonPresses, 
    totalContributors, 
    userContribution,
    incrementButtonPresses, 
    addToPot, 
    userHasWon,
    aiMessage,
    currentColorScheme,
    updateAIMessage,
    recordPress,
    potGrowthRate,
    conversionRates,
    setBetAmount,
    betAmount,
    winMultiplier,
    claimReward,
    isClaimingReward,
    claimSuccess,
    refreshConversionRates
  } = useMoneyButton();
  
  const [isPressed, setIsPressed] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [winAnimation, setWinAnimation] = useState(false);
  const [contribution, setContribution] = useState(Math.max(0.01, betAmount)); // Ensure minimum of 0.01
  const [selectedCurrency, setSelectedCurrency] = useState('MNT');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [selectedMessageType, setSelectedMessageType] = useState<'fomo' | 'greed' | 'urgency' | 'reward' | 'social'>('greed');
  const [glowEffect, setGlowEffect] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [particles, setParticles] = useState<{id: number, x: number, y: number}[]>([]);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [lastBetChangeTime, setLastBetChangeTime] = useState(0);
  const [showBetChangeEffect, setShowBetChangeEffect] = useState(false);
  const [showBetConfirmation, setShowBetConfirmation] = useState(false);
  const [lastBetAmount, setLastBetAmount] = useState('');
  const [lastBetCurrency, setLastBetCurrency] = useState('');
  const [customAmount, setCustomAmount] = useState(contribution.toString());
  
  // Bridging state
  const [bridgeStatus, setBridgeStatus] = useState('idle');
  const [bridgeTxHash, setBridgeTxHash] = useState('');

  // Blockchain connections
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [betContract, setBetContract] = useState(null);
  const [priceFeeds, setPriceFeeds] = useState({});

  // Load real prices on component mount
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/prices');
        const data = await response.json();
        
        if (data.prices) {
          setPriceFeeds(data.prices);
          console.log('Real-time price data loaded:', data.prices);
        }
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      }
    };
    
    fetchPrices();
    // Refresh prices every minute
    const interval = setInterval(fetchPrices, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get an AI-generated message
  const getAIMessage = async (messageType, context) => {
    try {
      const response = await fetch('/api/ai-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageType,
          context
        })
      });
      
      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error getting AI message:', error);
      return 'Welcome to Money Button!';
    }
  };
  
  // Handle cross-chain bridging
  const handleCrossChainDeposit = async () => {
    try {
      // Get user's wallet address
      if (!window.ethereum) {
        throw new Error('No wallet detected');
      }
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      const userAddress = accounts[0];
      
      setBridgeStatus('pending');
      
      // Find the currency details
      const currencyDetails = SUPPORTED_CURRENCIES.find(
        c => c.symbol === selectedCurrency
      );
      
      if (!currencyDetails) {
        throw new Error('Currency not supported');
      }
      
      // Make API call to bridge service
      const response = await fetch('/api/bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceChain: currencyDetails.chain,
          targetChain: 'Mantle', // Target chain for Money Button
          tokenAddress: currencyDetails.tokenAddress,
          amount: contribution.toString(),
          recipientAddress: userAddress
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBridgeStatus('completed');
        setBridgeTxHash(data.txHash);
        
        // Generate AI message about bridging
        const aiMessage = await getAIMessage(MessageType.CROSS_CHAIN, {
          sourceChain: currencyDetails.chain,
          destChain: 'Mantle',
          amount: contribution,
          currency: selectedCurrency
        });
        
        // Update AI message
        updateAIMessage(aiMessage);
        
        // Auto-press after successful bridge
        setTimeout(() => {
          handleButtonPress();
        }, 1000);
      } else {
        setBridgeStatus('failed');
        console.error('Bridge failed:', data.error);
      }
    } catch (error) {
      console.error('Error in cross-chain deposit:', error);
      setBridgeStatus('failed');
    }
  };
  
  // Handle button press with real AI integration
  const handleButtonPress = async () => {
    setIsPressed(true);
    playPressSound();
    saveBetDetails();
    
    // Check if selected currency requires bridging
    const currencyDetails = SUPPORTED_CURRENCIES.find(c => c.symbol === selectedCurrency);
    if (currencyDetails && currencyDetails.requiresBridging) {
      // Open AI Bridge chat
      if (onShowAIBridge) {
        onShowAIBridge(selectedCurrency, contribution.toString());
      }
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Simulate processing for demo purposes
      // In production, this would be a real blockchain transaction
      setTimeout(async () => {
        setIsProcessing(false);
        setShowBetConfirmation(true);
        playConfirmSound();
        
        // Trigger pot increase animation
        triggerPotIncrease();
        
        // Generate real AI message for bet confirmation
        const aiMessage = await getAIMessage(MessageType.BET_PLACED, {
          amount: contribution,
          currency: selectedCurrency
        });
        
        // Update AI message
        updateAIMessage(aiMessage);
        
        // For jackpot updates
        const jackpotMessage = await getAIMessage(MessageType.JACKPOT_INCREASED, {
          newAmount: (pot + contribution).toFixed(2),
          currency: 'MNT'
        });
        
        // Schedule jackpot message for later
        setTimeout(() => {
          updateAIMessage(jackpotMessage);
        }, 5000);
        
      }, 2000);
    } catch (error) {
      console.error('Error processing bet:', error);
      setIsProcessing(false);
      // Show error message
    }
  };
  
  // Sync bet amount with context
  useEffect(() => {
    setContribution(betAmount);
  }, [betAmount]);
  
  // Create particles for visual effects when pot changes
  useEffect(() => {
    // Create random particles for visual effect
    const createParticles = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const newParticles = Array.from({ length: 8 }, (_, i) => ({
          id: Date.now() + i,
          x: centerX,
          y: centerY
        }));
        
        setParticles(prev => [...prev, ...newParticles]);
        
        // Clean up particles after animation completes
        setTimeout(() => {
          setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
        }, 1600);
      }
    };
    
    // Listen for pot-increased events
    const handlePotIncrease = () => {
      createParticles();
    };
    
    window.addEventListener('pot-increased', handlePotIncrease);
    
    return () => {
      window.removeEventListener('pot-increased', handlePotIncrease);
    };
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Animate glow effect periodically to attract attention
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowEffect(prev => !prev);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Win animation effect
  useEffect(() => {
    if (userHasWon) {
      setWinAnimation(true);
      setTimeout(() => setWinAnimation(false), 5000);
    }
  }, [userHasWon]);
  
  // Update AI message based on user behavior
  useEffect(() => {
    if (buttonPresses > 0) {
      updateAIMessage(DEMO_WALLET);
    }
  }, [buttonPresses, updateAIMessage]);
  
  // Apply random message type selection with bias toward most effective types
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * MESSAGE_TYPES.length);
      setSelectedMessageType(MESSAGE_TYPES[randomIndex]);
    }, 60000); // Change message type every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Visual confirmation of button press
  const buttonPressEffect = () => {
    // Create ripple effect
    const button = buttonRef.current;
    if (button) {
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;
      
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = '0px';
      circle.style.top = '0px';
      circle.style.position = 'absolute';
      circle.style.borderRadius = '50%';
      circle.style.backgroundColor = `${currentColorScheme.accent}30`;
      circle.style.transform = 'scale(0)';
      circle.style.animation = 'ripple 600ms linear';
      
      const ripple = button.getElementsByClassName('ripple')[0];
      if (ripple) {
        ripple.remove();
      }
      
      circle.classList.add('ripple');
      button.appendChild(circle);
      
      setTimeout(() => {
        if (circle && circle.parentNode) {
          circle.parentNode.removeChild(circle);
        }
      }, 600);
    }
  };
  
  // Initialize blockchain connections
  useEffect(() => {
    const initBlockchain = async () => {
      if (window.ethereum) {
        try {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(web3Provider);
          
          const userSigner = web3Provider.getSigner();
          setSigner(userSigner);
          
          // Connect to the bet contract on the chain
          const contractAddress = '0x...'; // Insert your deployed contract address here
          const contract = new ethers.Contract(contractAddress, BetContractABI, userSigner);
          setBetContract(contract);
          
          // Initialize price feeds
          const feeds = {};
          for (const currency of SUPPORTED_CURRENCIES) {
            if (CHAINLINK_PRICE_FEEDS[currency.symbol]) {
              const priceFeedAddress = CHAINLINK_PRICE_FEEDS[currency.symbol];
              const aggregatorV3InterfaceABI = [
                "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"
              ];
              const priceFeed = new ethers.Contract(priceFeedAddress, aggregatorV3InterfaceABI, web3Provider);
              feeds[currency.symbol] = priceFeed;
            }
          }
          setPriceFeeds(feeds);
        } catch (error) {
          console.error("Error initializing blockchain connections:", error);
        }
      }
    };
    
    initBlockchain();
  }, []);
  
  // Change bet amount and update context
  const handleBetAmountChange = (amount: number) => {
    // Ensure bet amount is valid
    const minAmountInUSD = 0.01;
    const maxAmount = 500;
    
    // Convert min USD amount to selected currency
    // If 1 ETH = $3800, then $0.01 = 0.01/3800 ETH
    const minAmountInSelectedCurrency = minAmountInUSD / conversionRates[selectedCurrency];
    
    // Ensure the amount is within valid range
    const validAmount = Math.min(maxAmount, Math.max(minAmountInSelectedCurrency, amount));
    
    setContribution(validAmount);
    setBetAmount(validAmount);
    
    // Update custom amount field if using custom
    if (customAmount !== validAmount.toString()) {
      setCustomAmount(validAmount.toString());
    }
    
    // Show brief feedback animation when changing bet
    setLastBetChangeTime(Date.now());
    setShowBetChangeEffect(true);
    setTimeout(() => setShowBetChangeEffect(false), 500);
  };

  // Handle custom amount input
  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers and decimals
    const regex = /^[0-9]*\.?[0-9]*$/;
    if (value === '' || regex.test(value)) {
      setCustomAmount(value);
      
      if (value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          handleBetAmountChange(numValue);
        }
      }
    }
  };

  // Select a different currency
  const handleCurrencyChange = (currency: string) => {
    // Calculate the current USD value 
    const currentUsdValue = contribution * conversionRates[selectedCurrency];
    
    // Set the new currency
    setSelectedCurrency(currency);
    setShowCurrencyDropdown(false);
    
    // Refresh conversion rates
    refreshConversionRates();
    
    // Convert the same USD value to the new currency
    const newContribution = currentUsdValue / conversionRates[currency];
    
    // Ensure it meets minimum USD requirement
    const minAmountInUSD = 0.01;
    const minAmountInSelectedCurrency = minAmountInUSD / conversionRates[currency];
    
    // Set the new contribution, ensuring it's at least the minimum
    handleBetAmountChange(Math.max(newContribution, minAmountInSelectedCurrency));
  };
  
  // Dynamic frame styling based on emotional color scheme
  const frameStyle = {
    backgroundColor: currentColorScheme.background,
    borderColor: currentColorScheme.primary,
    color: currentColorScheme.text,
  };
  
  const buttonStyle = {
    backgroundColor: isPressed ? currentColorScheme.secondary : currentColorScheme.primary,
    borderColor: currentColorScheme.secondary,
    boxShadow: glowEffect 
      ? `0 0 40px 10px ${currentColorScheme.primary}80` 
      : `0 0 20px 5px ${currentColorScheme.primary}40`,
  };
  
  const messageStyle = {
    color: currentColorScheme.accent,
  };
  
  // Render particles for pot increase visual effect
  const renderParticles = () => {
    return particles.map(particle => (
      <PotParticleEffect 
        key={particle.id} 
        color={currentColorScheme.accent} 
        x={particle.x} 
        y={particle.y}
      />
    ));
  };
  
  if (!window.ethereum) {
    return (
      <div className="flex flex-col items-center w-full max-w-md">
        <motion.div 
          className="w-full p-6 rounded-xl border-2 border-gray-800 shadow-2xl"
          style={{ backgroundColor: '#0a0a0a' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-300">Money Button</h3>
            <div className="text-sm px-3 py-1 bg-gray-800 rounded-full text-gray-400">Disconnected</div>
          </div>
          
          <div className="flex flex-col items-center py-6">
            <div className="w-48 h-48 rounded-full bg-gray-800 flex items-center justify-center font-bold text-xl text-gray-400 border-8 border-gray-700 opacity-70">
              <span className="text-center">CONNECT WALLET</span>
            </div>
            <p className="mt-8 text-gray-500 text-xl max-w-md text-center">
              Connect your wallet to press the Money Button
            </p>
          </div>
          
          <div className="mt-4 flex justify-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <IconWallet size={16} />
              <span>Cross-chain compatible with Wormhole</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (userHasWon) {
    return (
      <div className="flex flex-col items-center w-full max-w-md">
        <motion.div 
          className="w-full p-6 rounded-xl border-2 shadow-2xl"
          style={{
            backgroundColor: '#000000',
            borderColor: '#fbbf24',
            boxShadow: '0 0 80px 20px rgba(251,191,36,0.3)'
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            boxShadow: ['0 0 80px 20px rgba(251,191,36,0.3)', '0 0 120px 40px rgba(251,191,36,0.5)', '0 0 80px 20px rgba(251,191,36,0.3)']
          }}
          transition={{ 
            duration: 0.7,
            boxShadow: {
              repeat: Infinity,
              duration: 2
            }
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-yellow-400">WINNER!</h3>
            <div className="text-sm px-3 py-1 bg-yellow-900 rounded-full text-yellow-300">Jackpot</div>
          </div>
          
          <div className="flex flex-col items-center py-8">
            <motion.div 
              className="w-48 h-48 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-3xl text-white border-8 border-yellow-600"
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 0 40px 10px rgba(251,191,36,0.7)',
                  '0 0 60px 20px rgba(251,191,36,0.9)',
                  '0 0 40px 10px rgba(251,191,36,0.7)'
                ]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2
              }}
            >
              YOU WON!
            </motion.div>
            
            <motion.div 
              className="mt-8 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-yellow-300 text-2xl font-bold max-w-md text-center">
                Congratulations! You've won:
              </p>
              <div className="mt-2 flex flex-col items-center">
                <span className="text-3xl font-extrabold text-yellow-400">{formatCurrencyValue(pot)} MNT</span>
                <span className="text-xl font-semibold text-green-400 mt-1">= ${formatCurrencyValue(potInUSDC)} USDC</span>
              </div>
            </motion.div>
          </div>
          
          <div className="mt-4 flex justify-center">
            {isClaimingReward ? (
              <div className="flex flex-col items-center">
                {claimSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <motion.div 
                      className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-10 w-10 text-white" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={3} 
                          d="M5 13l4 4L19 7" 
                          className="checkmark"
                        />
                      </svg>
                    </motion.div>
                    <p className="text-green-400 font-semibold">Transfer successful!</p>
                    <p className="text-gray-400 text-sm mt-1">Funds sent to your wallet</p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center">
                    <motion.div 
                      className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full" 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-yellow-400 mt-3">Processing transaction...</p>
                  </div>
                )}
              </div>
            ) : (
              <motion.button
                className="mt-4 px-8 py-4 bg-yellow-600 text-white font-bold text-lg rounded-md hover:bg-yellow-500"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(251,191,36,0.5)' }}
                whileTap={{ scale: 0.95 }}
                onClick={claimReward}
              >
                CLAIM REWARD
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <motion.div 
        className="relative rounded-xl overflow-hidden"
        style={frameStyle}
        animate={{ scale: winAnimation ? 1.05 : 1, borderColor: winAnimation ? '#4ade80' : currentColorScheme.primary }}
        transition={{ duration: winAnimation ? 0.5 : 0.2 }}
      >
        <div className="p-5">
          {/* Title and currency selector */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Money Button</h2>
            <div className="relative">
              <button
                className="flex items-center space-x-1 px-3 py-1 rounded-full"
                style={{ 
                  backgroundColor: currentColorScheme.backgroundDark,
                  color: currentColorScheme.text
                }}
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              >
                {CURRENCY_ICONS[selectedCurrency]}
                <span className="mx-1">{selectedCurrency}</span>
                <IconChevronDown size={16} />
              </button>
              <AnimatePresence>
                {showCurrencyDropdown && (
                  <div 
                    ref={dropdownRef}
                    className="absolute top-full right-0 mt-1 w-56 rounded-lg shadow-lg"
                    style={{ 
                      backgroundColor: currentColorScheme.backgroundDark,
                      border: `1px solid ${currentColorScheme.primary}30`,
                      zIndex: 1000
                    }}
                  >
                    <div className="py-1 max-h-72 overflow-y-auto">
                      {SUPPORTED_CURRENCIES.map(currency => (
                        <motion.div
                          key={currency.symbol}
                          className="flex flex-col px-4 py-2 text-sm cursor-pointer border-b"
                          style={{ 
                            color: currentColorScheme.text,
                            backgroundColor: selectedCurrency === currency.symbol ? `${currentColorScheme.primary}20` : 'transparent',
                            borderColor: `${currentColorScheme.text}10`
                          }}
                          whileHover={{ backgroundColor: `${currentColorScheme.primary}30` }}
                          onClick={() => handleCurrencyChange(currency.symbol)}
                        >
                          <div className="flex items-center">
                            {CURRENCY_ICONS[currency.symbol]}
                            <span className="ml-2 font-medium">{currency.symbol}</span>
                            {selectedCurrency === currency.symbol && (
                              <span className="ml-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span style={{ color: currentColorScheme.textMuted }}>{currency.name}</span>
                            <span style={{ color: `${currentColorScheme.primary}90` }}>{currency.chain}</span>
                          </div>
                          {currency.symbol !== 'USDC' && (
                            <div className="text-xs mt-1" style={{ color: currentColorScheme.textMuted }}>
                              1 {currency.symbol} = ${conversionRates[currency.symbol] ? conversionRates[currency.symbol].toFixed(2) : '—'} USD
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Show Bridge Status if active */}
          <AnimatePresence>
            {bridgeStatus !== 'idle' && (
              <BridgeStatus
                status={bridgeStatus}
                txHash={bridgeTxHash}
                currency={selectedCurrency}
                amount={formatCurrencyValue(contribution, 3)}
                onRetry={handleCrossChainDeposit}
              />
            )}
          </AnimatePresence>
          
          {/* Main button */}
          <div className="flex justify-center mb-6">
            <div
              ref={buttonRef}
              className={`relative cursor-pointer w-48 h-48 rounded-full flex items-center justify-center overflow-hidden ${isPressed ? 'button-glow' : ''}`}
              style={{
                backgroundColor: currentColorScheme.primary,
                boxShadow: glowEffect ? `0 0 40px 5px ${currentColorScheme.primary}` : `0 0 20px 0px ${currentColorScheme.primary}50`,
                transition: 'box-shadow 0.3s ease',
              }}
              onClick={handleButtonPress}
              onMouseDown={() => setGlowEffect(true)}
              onMouseUp={() => setGlowEffect(false)}
              onMouseLeave={() => setGlowEffect(false)}
            >
              {isRotating && (
                <motion.div 
                  className="absolute inset-0 rounded-full"
                  style={{ 
                    border: `4px solid ${currentColorScheme.accent}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%'
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span className="relative z-10">PRESS ME</span>
            </div>
          </div>
          
          {/* AI Message - Restored */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`message-${buttonPresses}`}
              className="mt-6 max-w-md text-center min-h-[60px] flex items-center justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p 
                className="text-xl" 
                style={{ 
                  color: currentColorScheme.accent,
                  textShadow: `0 0 8px ${currentColorScheme.accent}40`
                }}
              >
                {aiMessage}
              </p>
            </motion.div>
          </AnimatePresence>
          
          {/* Bet amount input */}
          <div className="w-full mt-4 p-3 rounded-lg" style={{ backgroundColor: currentColorScheme.backgroundDark }}>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium" style={{ color: currentColorScheme.text }}>
                Bet Amount:
                <motion.span 
                  className="ml-1 font-bold" 
                  style={{ color: currentColorScheme.accent }}
                  animate={{ 
                    scale: showBetChangeEffect ? [1, 1.2, 1] : 1,
                    color: showBetChangeEffect 
                      ? [currentColorScheme.accent, '#4ade80', currentColorScheme.accent] 
                      : currentColorScheme.accent
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {contribution.toFixed(3)}
                </motion.span>
              </div>
              <div className="text-xs px-2 py-0.5 rounded" style={{ 
                backgroundColor: `${currentColorScheme.primary}20`,
                color: currentColorScheme.accent
              }}>
                +{Math.round((winMultiplier - 1) * 100)}% win chance
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs" style={{ color: currentColorScheme.textMuted }}>
                Min: {(0.01 / conversionRates[selectedCurrency]).toFixed(8)} {selectedCurrency}
              </div>
              
              <div className="text-xs px-2 py-1 rounded bg-opacity-20" style={{ 
                backgroundColor: `${currentColorScheme.primary}30`,
                color: currentColorScheme.text 
              }}>
                USD: ~${(contribution * conversionRates[selectedCurrency]).toFixed(2)}
              </div>
              
              <div className="text-xs" style={{ color: currentColorScheme.textMuted }}>
                Max: 500 {selectedCurrency}
              </div>
            </div>
            
            <div className="flex w-full">
              <div className="relative flex w-full">
                <input
                  type="text"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-right pr-20"
                  style={{ 
                    backgroundColor: `${currentColorScheme.background}80`,
                    color: currentColorScheme.text,
                    border: `1px solid ${currentColorScheme.primary}50`,
                    outline: 'none'
                  }}
                  placeholder={`Enter amount (max 500 ${selectedCurrency})`}
                />
                <div 
                  className="absolute right-0 top-0 bottom-0 flex items-center px-3 rounded-r-lg"
                  style={{ 
                    backgroundColor: `${currentColorScheme.primary}50`,
                    color: currentColorScheme.text
                  }}
                >
                  {selectedCurrency}
                </div>
              </div>
            </div>
            
            {/* Quick amount buttons */}
            <div className="flex justify-between mt-2 gap-2">
              {[0.01, 0.1, 1, 10, 50].map((amountUSD) => {
                // Convert USD amount to the selected currency
                const amountInCurrency = amountUSD / conversionRates[selectedCurrency];
                
                // Ensure minimum USD requirement is met
                const minAmountInUSD = 0.01;
                const minAmountInSelectedCurrency = minAmountInUSD / conversionRates[selectedCurrency];
                const quickAmount = Math.max(amountInCurrency, minAmountInSelectedCurrency);
                
                return (
                  <button
                    key={amountUSD}
                    onClick={() => handleBetAmountChange(quickAmount)}
                    className="flex-1 text-xs py-1 rounded"
                    style={{ 
                      backgroundColor: `${currentColorScheme.primary}30`,
                      color: currentColorScheme.text
                    }}
                  >
                    {amountUSD < 1 ? 
                      `$${amountUSD}` : 
                      `$${amountUSD}`
                    }
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency Selector and Stats */}
          <div className="w-full mt-4 flex justify-between items-center">
            <div style={{ color: currentColorScheme.text }}>
              {buttonPresses > 0 && (
                <div className="flex items-center">
                  <span>Presses: </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={buttonPresses}
                      className="ml-1 font-bold"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {buttonPresses}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Visual pot growth representation */}
          {buttonPresses > 0 && (
            <motion.div 
              className="w-full mt-4 h-3 rounded-full overflow-hidden bg-opacity-30 relative"
              style={{ backgroundColor: `${currentColorScheme.backgroundDark}` }}
            >
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: currentColorScheme.accent }}
                initial={{ width: '0%' }}
                animate={{ 
                  width: `${Math.min(100, pot * 10)}%`,
                }}
                transition={{ 
                  type: 'spring',
                  stiffness: 50,
                  damping: 10
                }}
              />
            </motion.div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-opacity-20" style={{ borderColor: currentColorScheme.text }}>
          <motion.div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowInfo(!showInfo)}
          >
            <div className="flex items-center text-sm" style={{ color: `${currentColorScheme.text}90` }}>
              <IconCoin size={16} style={{ marginRight: '4px' }} />
              <span>80% to pot, 20% to creator</span>
            </div>
            <motion.div
              animate={{ rotate: showInfo ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <IconChevronRight size={18} style={{ color: currentColorScheme.text }} />
            </motion.div>
          </motion.div>
          
          <AnimatePresence>
            {showInfo && (
              <motion.div 
                className="mt-4 text-sm"
                style={{ color: `${currentColorScheme.text}80` }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p>Every press has a chance to win the entire pot!</p>
                <p className="mt-1">Powered by Wormhole - use any token on any chain.</p>
                <p className="mt-1">Higher bet amount = better odds of winning!</p>
                <div className="flex items-center mt-2">
                  <span className="mr-2">Your chance:</span>
                  <motion.span 
                    style={{ color: currentColorScheme.accent }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [1, 0.8, 1]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2,
                      repeatType: 'reverse'
                    }}
                  >
                    {(BASE_WIN_RATE * 100 * winMultiplier).toFixed(2)}%
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      {/* Bet confirmation overlay */}
      <AnimatePresence>
        {showBetConfirmation && (
          <BetConfirmation amount={lastBetAmount} currency={lastBetCurrency} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Styled bet confirmation for clear dopamine hit
const BetConfirmation = ({ amount, currency }: { amount: string, currency: string }) => {
  const { currentColorScheme } = useMoneyButton();
  
  // Calculate the 80/20 split for display
  const amountValue = parseFloat(amount);
  const potContribution = (amountValue * 0.8).toFixed(3);
  const creatorFee = (amountValue * 0.2).toFixed(3);
  
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="bg-opacity-70 backdrop-blur-md rounded-xl p-6 shadow-xl border-2 flex flex-col items-center max-w-xs"
        style={{ 
          backgroundColor: `${currentColorScheme.backgroundDark}95`,
          borderColor: currentColorScheme.primary,
          boxShadow: `0 0 30px 8px ${currentColorScheme.primary}40`
        }}
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 20, opacity: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      >
        <motion.div
          className="w-14 h-14 rounded-full mb-3 flex items-center justify-center"
          style={{ 
            backgroundColor: currentColorScheme.primary,
            boxShadow: `0 0 15px 2px ${currentColorScheme.primary}70` 
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        
        <motion.h3 
          className="text-lg font-bold mb-1"
          style={{ color: currentColorScheme.text }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Bet Confirmed
        </motion.h3>
        
        <motion.p
          className="text-sm mb-2"
          style={{ color: currentColorScheme.textMuted }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Your bet has been placed
        </motion.p>
        
        <motion.div
          className="py-2 px-5 rounded-full font-bold my-2 text-lg"
          style={{ 
            backgroundColor: `${currentColorScheme.accent}20`,
            color: currentColorScheme.accent,
            textShadow: `0 0 10px ${currentColorScheme.accent}80`
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {amount} {currency}
        </motion.div>
        
        {/* Display the 80/20 split */}
        <motion.div
          className="flex flex-col items-center gap-1 mt-2 border border-opacity-20 rounded-lg p-2 w-full"
          style={{
            borderColor: currentColorScheme.textMuted,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between w-full text-sm">
            <span style={{ color: currentColorScheme.textMuted }}>To Pot (80%):</span>
            <span style={{ color: currentColorScheme.text }}>{potContribution} {currency}</span>
          </div>
          <div className="flex justify-between w-full text-sm">
            <span style={{ color: currentColorScheme.textMuted }}>Creator Fee (20%):</span>
            <span style={{ color: currentColorScheme.text }}>{creatorFee} {currency}</span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}; 