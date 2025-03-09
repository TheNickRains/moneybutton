'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMoneyButton } from '../providers';
import { motion, AnimatePresence } from 'framer-motion';
import { IconArrowDown, IconArrowUp, IconChevronRight, IconCoin, IconWallet, IconCurrencyDollar, IconCurrencyEthereum, IconCurrencyBitcoin, IconChevronDown, IconRobot, IconCheck, IconLoader2, IconArrowRight, IconInfoCircle, IconX, IconFlame, IconUsers, IconRocket } from '@tabler/icons-react';
import { ethers } from 'ethers';
import { CHAINLINK_PRICE_FEEDS } from '../constants/chainlink';
import ActivityLog from './ActivityLog';
import UserFeedback from './UserFeedback';
import { generateEmotionalResponse, generateWinCelebration, generateQuickFeedback } from '../services/moneyButtonAIService';
import BetContractABI from '../contracts/BetContract.json';
import TokenIcon from './TokenIcon';
import { formatCurrencyValue } from '../utils/formatters';
import Particle from './Particle';
import { throttle } from 'lodash';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useCoinbaseWallet } from '../hooks/useCoinbaseWallet';
import { generateWindParticles, generateRainParticles } from '../services/particleService';

// Create cosmic star background for visual effect
const CosmicParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10">
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 3}px`,
            height: `${Math.random() * 3}px`,
            opacity: Math.random() * 0.5 + 0.3,
            animation: `twinkle ${Math.random() * 5 + 3}s infinite`
          }}
        />
      ))}
    </div>
  );
};

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
];

// Currency icons mapping
const CURRENCY_ICONS: Record<string, React.ReactElement> = {
  'MNT': <IconCoin size={16} />,
};

// Format currency values for display
const formatCurrencyValue = (value: number, decimals = 2): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  } else {
    return value.toFixed(decimals);
  }
};

// Interface for the component props
interface MoneyButtonProps {
  onShowAIBridge?: (currency: string, amount: string) => void;
}

// Helper function to calculate 80/20 split for bets
const calculateBetSplit = (amount: number) => {
  return {
    toPot: amount * 0.8, // 80% to pot
    toCreator: amount * 0.2 // 20% to creator fee
  };
};

// Main Money Button component
export default function MoneyButton({ onShowAIBridge }: MoneyButtonProps = {}) {
  const { 
    walletAddress, 
    isWalletConnected, 
    mntBalance,
    potInUSDC,
    pot,
    currentColorScheme,
    conversionRates,
    totalContributors,
    addToPot,
    setAiMessage,
    aiMessage
  } = useMoneyButton();
  
  // State for UI elements
  const [amount, setAmount] = useState<number>(0.1);
  const [customAmount, setCustomAmount] = useState<number>(0.1);
  const [isAmountOpen, setIsAmountOpen] = useState<boolean>(false);
  const [buttonMessage, setButtonMessage] = useState<string>("Press to Win");
  const [showAiMessage, setShowAiMessage] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showUrgencyMessage, setShowUrgencyMessage] = useState<boolean>(false);
  const [nearMissOccurred, setNearMissOccurred] = useState<boolean>(false);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [buttonPresses, setButtonPresses] = useState<number>(0);
  const [totalContributed, setTotalContributed] = useState<number>(0);
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);
  const [showActivityLog, setShowActivityLog] = useState<boolean>(false);
  const [aiMessageType, setAiMessageType] = useState<'fomo' | 'greed' | 'urgency' | 'reward' | 'social'>('fomo');
  const [buttonStatus, setButtonStatus] = useState<'idle' | 'pressed' | 'success' | 'error'>('idle');
  const [showBridgePrompt, setShowBridgePrompt] = useState<boolean>(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [showBetConfirmation, setShowBetConfirmation] = useState(false);
  const [aiPersonality, setAiPersonality] = useState<'taunt' | 'support' | 'excited' | 'neutral'>('neutral');
  
  // Add psychological state variables
  const [psychologicalTrigger, setPsychologicalTrigger] = useState<'fomo' | 'scarcity' | 'social' | 'streak' | 'nearMiss'>('fomo');
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  
  // Calculate win rate based on contribution amount
  const calculateWinRate = (contributionAmount: number): number => {
    const baseWinRate = BASE_WIN_RATE;
    const multiplier = Math.sqrt(contributionAmount * 100); // Higher contributions give better odds
    return baseWinRate * multiplier;
  };
  
  // Format win chance for display
  const formatWinChance = (winRate: number): string => {
    if (winRate < 0.0001) {
      return `${(winRate * 100000).toFixed(2)}×10⁻³%`;
    } else {
      return `${(winRate * 100).toFixed(4)}%`;
    }
  };
  
  // Set up psychological message timing
  useEffect(() => {
    // Show urgency messages periodically
    const urgencyInterval = setInterval(() => {
      // Only show if user has bet at least once
      if (buttonPresses > 0) {
        setShowUrgencyMessage(true);
        
        // Random psychological trigger
        const triggers: ('fomo' | 'scarcity' | 'social' | 'streak' | 'nearMiss')[] = ['fomo', 'scarcity', 'social', 'streak', 'nearMiss'];
        setPsychologicalTrigger(triggers[Math.floor(Math.random() * triggers.length)]);
        
        // Hide after 5 seconds
        setTimeout(() => setShowUrgencyMessage(false), 5000);
      }
    }, 20000 + Math.random() * 20000); // Random interval between 20-40 seconds
    
    return () => clearInterval(urgencyInterval);
  }, [buttonPresses]);
  
  // Generate AI messages to create psychological manipulation
  const getPsychologicalMessage = (): string => {
    switch (psychologicalTrigger) {
      case 'fomo':
        return `${totalContributors} players are betting right now! Don't miss your chance to win ${formatCurrencyValue(pot)} MNT!`;
      case 'scarcity':
        return `Limited time boost! Your next bet has a ${calculateWinRate(amount) * 120}% higher chance to win!`;
      case 'social':
        return `User_${Math.floor(1000 + Math.random() * 9000)} just won ${(Math.random() * 5).toFixed(2)} MNT with a similar bet size!`;
      case 'streak':
        return `You're on a streak! ${streakCount} bets in a row increases your likelihood of winning!`;
      case 'nearMiss':
        return `You were incredibly close to winning on your last bet. Try again!`;
      default:
        return `The pot is growing! Current jackpot: ${formatCurrencyValue(pot)} MNT`;
    }
  };
  
  // Generate emotionally charged AI messages using the AI service
  const generateAIFeedback = async (context: 'pre-bet' | 'post-loss' | 'near-miss' | 'win'): Promise<string> => {
    try {
      let prompt = "";
      let triggerType: 'fomo' | 'greed' | 'urgency' | 'reward' | 'social' = 'fomo';
      
      switch (context) {
        case 'pre-bet':
          prompt = "Create an exciting message to encourage the user to press the Money Button";
          triggerType = 'fomo';
          break;
        
        case 'post-loss':
          prompt = "Create a message to encourage the user to try again after losing";
          triggerType = 'urgency';
          break;
        
        case 'near-miss':
          prompt = "Create a message about how close the user was to winning and encourage them to try again";
          triggerType = 'greed';
          break;
        
        case 'win':
          prompt = "Create a celebratory message for the user who just won the jackpot";
          triggerType = 'reward';
          break;
      }
      
      // Add context information for more personalized responses
      const contextInfo = {
        streakCount,
        totalContributed,
        potSize: pot,
        nearMiss: nearMissOccurred
      };
      
      // Call the AI service to generate a response
      const response = await generateEmotionalResponse(prompt, triggerType, contextInfo);
      return response;
    } catch (error) {
      console.error("Error generating AI feedback:", error);
      
      // Fallback responses if the AI service fails
      switch (context) {
        case 'pre-bet':
          return "This pot is growing fast! Get in before someone else wins it all!";
        case 'post-loss':
          return "Don't stop now! The next press could be the big winner!";
        case 'near-miss':
          return "WOW! You were milliseconds away from winning the whole pot! Your next bet is practically guaranteed!";
        case 'win':
          return "INCREDIBLE WIN! You've beaten the odds! Imagine what you could win next!";
        default:
          return "Press the Money Button to win big!";
      }
    }
  };
  
  // Function to process the bet and determine win/loss
  const processBet = async (betAmount: number): Promise<{ win: boolean; amount: number }> => {
    // Increment button press counter
    setButtonPresses((prev: number) => prev + 1);
    setTotalContributed((prev: number) => prev + betAmount);
    
    // Calculate 80/20 split using the helper function
    const { toPot, toCreator } = calculateBetSplit(betAmount);
    
    // In a real implementation, we would update the contract state here
    // For this demo, we're just simulating the interaction
    addToPot(toPot, 'MNT'); // Add only 80% to the pot
    
    // Log the creator fee (in a real implementation, this would be transferred to the creator)
    console.log(`Creator fee: ${toCreator} MNT (20% of bet)`);
    
    // Show ripple effect
    const ripple = document.createElement('span');
    ripple.classList.add('absolute', 'inset-0', 'bg-white', 'rounded-full', 'opacity-30');
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 1s ease-out forwards';
    buttonRef.current?.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 1000);
    
    // Increment streak counter
    setStreakCount(prev => prev + 1);
    
    // Calculate if user won
    const winRate = calculateWinRate(betAmount);
    const randomValue = Math.random();
    const hasWon = randomValue < winRate;
    
    // Enhanced near-miss effect (feels like they almost won)
    const isNearMiss = !hasWon && randomValue < winRate * 10;
    
    if (isNearMiss) {
      setNearMissOccurred(true);
      // Clear near-miss after 5 seconds
      setTimeout(() => setNearMissOccurred(false), 5000);
    }
    
    // Add an activity event for the user's bet
    const activityEvent = new CustomEvent('activity-event', {
      detail: {
        id: Date.now().toString(),
        type: 'bet',
        userName: walletAddress ? `User_${walletAddress.substring(2, 6)}` : 'Anonymous',
        amount: betAmount.toFixed(4),
        currency: 'MNT',
        timestamp: Date.now(),
        walletAddress: walletAddress || 'Anonymous'
      }
    });
    window.dispatchEvent(activityEvent);
    
    // Simulate network transaction
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    if (hasWon) {
      // User won!
      // Create reward message with emotional manipulation (celebration, relief, excitement)
      const winContext = {
        winAmount: formatCurrencyValue(pot),
        buttonPresses,
        previousContribution: totalContributed,
        userWalletAddress: walletAddress || 'Anonymous'
      };
      
      try {
        const rewardMessage = await generateWinCelebration(winContext);
        setButtonMessage(rewardMessage);
        setAiMessage(rewardMessage);
        
        // Add win event to activity feed
        const winEvent = new CustomEvent('activity-event', {
          detail: {
            id: (Date.now() + 1).toString(),
            type: 'win',
            userName: walletAddress ? `User_${walletAddress.substring(2, 6)}` : 'Anonymous',
            amount: formatCurrencyValue(pot),
            currency: 'MNT',
            timestamp: Date.now(),
            walletAddress: walletAddress || 'Anonymous'
          }
        });
        window.dispatchEvent(winEvent);
      } catch (error) {
        console.error('Error generating win message:', error);
        setButtonMessage(`🎉 YOU WON ${formatCurrencyValue(pot)} MNT!`);
        setAiMessage(`🎉 YOU WON ${formatCurrencyValue(pot)} MNT!`);
      }
    } else {
      setButtonMessage(`+${betAmount.toFixed(4)} MNT added to pot`);
    }
    
    // Show AI message
    setShowAiMessage(true);
    
    return { win: hasWon, amount: betAmount };
  };
  
  // Debounce AI feedback to prevent multiple rapid API calls
  const debouncedAIFeedback = async (context: 'pre-bet' | 'post-loss' | 'near-miss' | 'win'): Promise<string> => {
    // Use more static messages for common scenarios to reduce API calls
    const staticMessages = {
      'pre-bet': [
        "Press to win the growing pot!",
        "Others are betting right now!",
        "Your chance to win awaits!",
        "Don't miss this opportunity!",
        "The pot keeps growing - claim it now!"
      ],
      'post-loss': [
        "Don't stop now! Try again!",
        "So close! Next press could be it!",
        "Keep going - persistence pays off!",
        "That was a practice run. Now for real!"
      ],
      'near-miss': [
        "WOW! So close that time!",
        "You almost had it! Try again!",
        "Nearly there! One more press!"
      ],
      'win': [
        "INCREDIBLE WIN! You've done it!",
        "AMAZING! You beat the odds!",
        "JACKPOT! What a victory!"
      ]
    };

    // Only 25% of the time, use a static message instead of API call
    if (Math.random() < 0.25) {
      const messages = staticMessages[context];
      return messages[Math.floor(Math.random() * messages.length)];
    }
    
    // Otherwise, use the original implementation
    return await generateAIFeedback(context);
  };
  
  // Use debounced version of AI feedback in the component
  const triggerBetProcessing = async () => {
    try {
      // Close the confirmation modal
      setShowBetConfirmation(false);
      
      // Start animation
      setIsProcessing(true);
      setButtonStatus('pressed');
      
      // Play press animation/feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      // Process bet and check for win
      const result = await processBet(amount);
      setButtonStatus(result.win ? 'success' : 'idle');
      
      // Update button message with debounced AI feedback to reduce API calls
      const message = await debouncedAIFeedback(result.win ? 'win' : nearMissOccurred ? 'near-miss' : 'post-loss');
      setButtonMessage(message);
      
      // Show win effects if applicable
      setIsProcessing(false);
      
      // Show bridge prompt occasionally (20% chance)
      if (Math.random() < 0.2) {
        setTimeout(() => {
          setShowBridgePrompt(true);
        }, 2000);
      }
      
    } catch (error) {
      console.error("Error processing bet:", error);
      setButtonStatus('error');
      setButtonMessage("Oops! Something went wrong with your bet.");
      setIsProcessing(false);
      // Make sure to close the modal even in case of error
      setShowBetConfirmation(false);
    }
  };
  
  // Update the handle button press to use debounced AI feedback
  const handleButtonPress = async () => {
    // Ensure wallet is connected
    if (!isWalletConnected) {
      // Dispatch event to request wallet connection and return early
      window.dispatchEvent(new Event('wallet-connect-requested'));
      return;
    }
    
    // Show confirmation modal instead of processing immediately
    setShowBetConfirmation(true);
    
    // Pre-prime with AI message - use debounced version
    try {
      const message = await debouncedAIFeedback('pre-bet');
      setButtonMessage(message);
    } catch (error) {
      console.error("Error generating AI feedback:", error);
      setButtonMessage("Press to win big!");
    }
  };
  
  // Auto-hide AI messages after a delay
  useEffect(() => {
    if (showAiMessage) {
      const timer = setTimeout(() => {
        setShowAiMessage(false);
      }, 7000);
      
      return () => clearTimeout(timer);
    }
  }, [showAiMessage]);
  
  // Calculate win chance
  const winChance = calculateWinRate(amount);
  const formattedWinChance = formatWinChance(winChance);
  
  // Cosmic background gradient style
  const cosmicGradient = {
    background: 'radial-gradient(circle at center, rgba(78, 90, 255, 0.2) 0%, rgba(4, 6, 19, 0) 70%)',
    animation: 'pulse 4s ease-in-out infinite alternate'
  };
  
  // Timer to occasionally prompt the user when idle
  useEffect(() => {
    if (!buttonMessage) {
      const timer = setTimeout(async () => {
        try {
          const message = await generateAIFeedback('pre-bet');
          setButtonMessage(message);
        } catch (error) {
          console.error("Error generating AI feedback:", error);
          setButtonMessage("Press to win big!");
        }
      }, 15000); // 15 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [buttonMessage]);
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-h-full overflow-hidden">
      <div className="relative w-full max-w-sm mx-auto flex flex-col items-center overflow-auto">
        {/* Money Button Section */}
        <div className="money-button-container relative w-full flex flex-col items-center py-2 md:py-4">
          {/* Cosmic Stars Background */}
          <CosmicParticles />
          
          {/* Psychological Trigger - Near Miss Effect */}
          <AnimatePresence>
            {nearMissOccurred && (
              <motion.div
                className="absolute inset-0 z-10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="h-full w-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 to-purple-600/10 animate-pulse"></div>
                  <motion.div 
                    className="text-xl font-bold text-yellow-300 text-center px-4"
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    SO CLOSE!<br/>
                    <span className="text-sm">Try again for the win!</span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Button Container */}
          <div className="z-10 w-full flex flex-col items-center">
            {/* Currency Information */}
            <div className="flex items-center justify-center mb-2">
              <TokenIcon token="MNT" size="sm" className="mr-2" />
              <span className="text-xs md:text-sm text-gray-300 font-mono">
                1 MNT = ${conversionRates?.MNT ? formatCurrencyValue(conversionRates.MNT, 2) : "0.50"} USD
              </span>
            </div>
            
            {/* Pot Display - Enhanced with animations */}
            <div className="text-center mb-2">
              <div className="text-xs md:text-sm text-gray-400 mb-1">Current Jackpot</div>
              <motion.div 
                className="pot-value text-xl md:text-3xl font-bold text-white pot-pulse"
                animate={{ 
                  scale: [1, 1.03, 1],
                  textShadow: ["0 0 10px rgba(78, 90, 255, 0.5)", "0 0 20px rgba(78, 90, 255, 0.8)", "0 0 10px rgba(78, 90, 255, 0.5)"]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                {formatCurrencyValue(pot)} <span className="flex items-center inline-flex text-blue-400"><TokenIcon token="MNT" size="sm" className="ml-1 mr-1" />MNT</span>
              </motion.div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">
                ≈ ${formatCurrencyValue(potInUSDC)}
              </div>
            </div>

            {/* Win chance and total contributors display */}
            <div className="flex justify-between text-xs md:text-sm w-full mb-2">
              <div className="text-gray-400">
                Win Chance: <span className="text-white font-medium">{formattedWinChance}</span>
              </div>
              <div className="text-gray-400">
                Contributors: <span className="text-white font-medium">{totalContributors}</span>
              </div>
            </div>
            
            {/* Urgency Message - Psychological Trigger */}
            <AnimatePresence>
              {showUrgencyMessage && (
                <motion.div 
                  className="w-full bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-lg border border-indigo-500/30 p-2 mb-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-center">
                    <IconInfoCircle size={16} className="text-indigo-400 mr-2 flex-shrink-0" />
                    <p className="text-xs text-indigo-200">{getPsychologicalMessage()}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Amount selector - Critical UI element */}
            <div className="w-full mb-4">
              <label className="block text-xs text-gray-400 mb-1">Bet Amount</label>
              <div className="relative">
                <div 
                  className={`flex items-center justify-between p-2 border ${isAmountOpen ? 'border-indigo-500' : 'border-gray-700'} rounded-lg bg-gray-800/50 cursor-pointer`}
                  onClick={() => setIsAmountOpen(!isAmountOpen)}
                >
                  <div className="flex items-center">
                    <TokenIcon token="MNT" size="sm" className="mr-2" />
                    <span className="font-medium text-sm">{amount.toFixed(4)} MNT</span>
                  </div>
                  <IconChevronDown size={16} className={`text-gray-400 transition-transform ${isAmountOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {/* Amount dropdown */}
                <AnimatePresence>
                  {isAmountOpen && (
                    <motion.div 
                      className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {/* Preset amounts */}
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {[0.1, 0.5, 1, 5, 10, 25].map(preset => (
                          <button
                            key={preset}
                            className={`p-1 rounded ${amount === preset ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'} text-xs font-medium`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAmount(preset);
                              setIsAmountOpen(false);
                            }}
                          >
                            {preset} <span className="text-xs">MNT</span>
                          </button>
                        ))}
                      </div>
                      
                      {/* Custom amount input */}
                      <div className="p-2 border-t border-gray-700">
                        <div className="flex items-center">
                          <input
                            type="number"
                            className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-sm"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                            onClick={(e) => e.stopPropagation()}
                            min="0.01"
                            step="0.01"
                          />
                          <button
                            className="ml-2 bg-indigo-600 hover:bg-indigo-700 rounded px-2 py-1 text-xs font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (customAmount > 0) {
                                setAmount(customAmount);
                                setIsAmountOpen(false);
                              }
                            }}
                          >
                            Set
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* The Money Button - Enhanced with pulsing effects */}
            <div className="relative mb-4">
              <motion.div
                className="absolute inset-0 rounded-full bg-indigo-500/20"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
              <button
                ref={buttonRef}
                className={`relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden 
                  bg-gradient-to-br ${buttonStatus === 'error' ? 'from-red-600 to-red-900' : 'from-indigo-600 via-indigo-700 to-indigo-900'} 
                  shadow-xl border-4 ${buttonStatus === 'success' ? 'border-purple-500 pulse-portal' : 'border-indigo-500/50'} 
                  ${buttonStatus === 'pressed' ? 'scale-95' : ''} ${buttonStatus === 'error' ? 'border-red-500/50' : ''} 
                  button-glow hover:shadow-indigo-500/30 hover:scale-105 active:scale-95
                  transition-all duration-200 ease-in-out money-button-enhanced interactive-glow ripple-container
                  ${isProcessing ? 'haptic-feedback' : ''}
                  ${showAiMessage ? 'celebrate' : ''}`}
                onClick={handleButtonPress}
                disabled={isProcessing}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-transparent via-indigo-900/10 to-indigo-900/20"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm md:text-lg font-bold text-white mantle-text-glow">MONEY BUTTON</span>
                  <span className="text-xs md:text-sm text-indigo-200 mt-1">PRESS TO WIN</span>
                  {isProcessing && (
                    <div className="mt-2">
                      <IconLoader2 className="animate-spin text-white" size={20} />
                    </div>
                  )}
                </div>
              </button>
            </div>
            
            {/* AI Message box - Enhanced with more manipulative messages */}
            <AnimatePresence>
              {(showAiMessage || buttonMessage) && (
                <motion.div
                  className={`mt-2 p-3 rounded-lg border border-gray-800 text-sm
                    ${aiPersonality === 'taunt' ? 'bg-gradient-to-r from-red-900/80 to-indigo-900/20 text-red-200' : 
                      aiPersonality === 'support' ? 'bg-gradient-to-r from-green-900/80 to-indigo-900/20 text-green-200' : 
                      aiPersonality === 'excited' ? 'bg-gradient-to-r from-yellow-900/80 to-indigo-900/20 text-yellow-200' : 
                      'bg-gradient-to-r from-gray-900/80 to-indigo-900/20 text-gray-200'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center pulse-portal
                        ${aiPersonality === 'taunt' ? 'bg-red-600' : 
                          aiPersonality === 'support' ? 'bg-green-600' : 
                          aiPersonality === 'excited' ? 'bg-yellow-600' : 
                          'bg-purple-600'}`}>
                        <IconRobot size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs md:text-sm">{buttonMessage || generateAIFeedback('pre-bet')}</div>
                      
                      {/* Bridge prompt call-to-action */}
                      {showBridgePrompt && onShowAIBridge && (
                        <motion.div 
                          className="mt-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <button
                            className="py-1 px-2 text-xs rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium flex items-center wormhole-text-glow pulse-portal"
                            onClick={() => onShowAIBridge('ETH', '0.1')}
                          >
                            <IconRobot size={14} className="mr-1.5" />
                            <span>Bridge more tokens to MNT</span>
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Bet Confirmation Modal - Enhanced with psychological triggers */}
      <AnimatePresence>
        {showBetConfirmation && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="fixed inset-0 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBetConfirmation(false)}
            />
            
            <motion.div
              className="bg-gray-900 border border-indigo-500/50 rounded-lg p-4 max-w-sm w-full shadow-xl z-10"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="text-lg font-bold text-white mb-2 text-center">Place Your Bet</h3>
              
              <div className="mb-4 bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Bet Amount:</span>
                  <span className="text-white font-medium">{amount.toFixed(4)} MNT</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">To Pot (80%):</span>
                  <span className="text-green-400">{(amount * 0.8).toFixed(4)} MNT</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">To Creator (20%):</span>
                  <span className="text-blue-400">{(amount * 0.2).toFixed(4)} MNT</span>
                </div>
                
                <div className="border-t border-gray-700 my-2 pt-2 flex justify-between">
                  <span className="text-gray-300">Win Chance:</span>
                  <span className="text-white font-medium">{formattedWinChance}</span>
                </div>
                
                {/* FOMO trigger in confirmation */}
                <div className="mt-2 text-xs text-center text-yellow-300">
                  The more you bet, the higher your chances!
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-md text-sm hover:bg-gray-600"
                  onClick={() => setShowBetConfirmation(false)}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 flex items-center"
                  onClick={triggerBetProcessing}
                >
                  <IconCoin size={16} className="mr-1.5" />
                  Place Bet
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add the ActivityLog component */}
      <ActivityLog colorScheme={currentColorScheme} />
      
      {/* Add the UserFeedback component */}
      <UserFeedback 
        message={buttonMessage}
        messageType={aiMessageType}
        colorScheme={currentColorScheme}
        isVisible={showAiMessage}
      />
    </div>
  );
} 