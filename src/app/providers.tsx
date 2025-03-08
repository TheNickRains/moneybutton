'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserMemory, generateEnhancedMessage, getEmotionalColorScheme, recordButtonPress } from './services/enhancedAiService';
import { getChainlinkPrice, formatPrice } from './services/chainlinkPriceFeeds';
import { defaultMantleTheme, mantleColorSchemes } from './styles/mantleTheme';

// Money Button Context with enhanced features
interface MoneyButtonContextType {
  pot: number;
  potInUSDC: number;
  buttonPresses: number;
  totalContributors: number;
  userContribution: number;
  creatorFees: number; // Track 20% creator fee
  incrementButtonPresses: () => void;
  addToPot: (amount: number, currency: string) => void;
  userHasWon: boolean;
  aiMessage: string;
  setAiMessage: (message: string) => void;
  currentColorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    backgroundDark: string;
    textMuted: string;
  };
  updateAIMessage: (address: string) => void;
  recordPress: (address: string, amount: number, messageType: 'fomo' | 'greed' | 'urgency' | 'reward' | 'social') => void;
  potGrowthRate: number;
  conversionRates: Record<string, number>;
  setBetAmount: (amount: number) => void;
  betAmount: number;
  winMultiplier: number;
  claimReward: () => void;
  isClaimingReward: boolean;
  claimSuccess: boolean;
  toggleColorTheme: () => void;
  refreshConversionRates: () => void;
}

// Create context with a default empty object
const MoneyButtonContext = createContext<MoneyButtonContextType | undefined>(undefined);

// Custom hook to use the Money Button context
export function useMoneyButton() {
  const context = useContext(MoneyButtonContext);
  if (context === undefined) {
    throw new Error('useMoneyButton must be used within a MoneyButtonProvider');
  }
  return context;
}

// Base win rate and max win rate for jackpot
const BASE_WIN_RATE = 0.0001; // 0.01% chance to win (lottery-like odds)
const MAX_WIN_RATE = 0.001;   // Maximum 0.1% chance to win with boosts

// Sample user address for AI personalization
const DEMO_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

// Calculate win multiplier based on bet amount
const getWinMultiplier = (betAmount: number): number => {
  // Base multiplier of 1.0 (normal odds)
  let multiplier = 1.0;
  
  // For small bets up to 0.1, scale linearly
  if (betAmount <= 0.1) {
    multiplier += (betAmount / 0.01 - 1) * 0.5; // 50% of bet increase
  } 
  // For medium bets (0.1 to 10), scale logarithmically
  else if (betAmount <= 10) {
    multiplier += 4.0 + Math.log10(betAmount / 0.1) * 2;
  }
  // For large bets (over 10), continue scaling but more slowly
  else {
    multiplier += 6.0 + Math.log10(betAmount / 10);
  }
  
  // Cap at 10x multiplier for extremely large bets
  return Math.min(10.0, multiplier);
};

export function Providers({ children }: { children: ReactNode }) {
  // State for pot and interaction - Start with a large pot value
  const [pot, setPot] = useState(5.83); // Start with a substantial pot
  const [potInUSDC, setPotInUSDC] = useState(3.91); // Initial USDC value (5.83 * 0.67)
  const [buttonPresses, setButtonPresses] = useState(47); // Show some initial activity
  const [betAmount, setBetAmount] = useState(0.01);
  const [totalContributors, setTotalContributors] = useState(147); // Start with some contributors
  const [userContribution, setUserContribution] = useState(0);
  const [creatorFees, setCreatorFees] = useState(0); // Track accumulated creator fees
  const [userHasWon, setUserHasWon] = useState(false);
  const [aiMessage, setAiMessage] = useState("Press the button to win the pot. Take a chance!");
  const [potGrowthRate, setPotGrowthRate] = useState(0.0025); // 0.25% growth per second
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [winMultiplier, setWinMultiplier] = useState(1.0);
  
  // Mantle theming
  const [currentColorScheme, setCurrentColorScheme] = useState(defaultMantleTheme);
  const [colorThemeIndex, setColorThemeIndex] = useState(0);
  
  // Dynamic conversion rates from Chainlink price feeds
  const [conversionRates, setConversionRates] = useState<Record<string, number>>({
    'MNT': 0.77,       // Updated Mantle token price
    'USDC': 1,         // Stablecoin pegged to USD
    'ETH': 3821.52,    // Updated Ethereum price
    'MATIC': 0.58,     // Updated Polygon price
    'BNB': 574.15,     // Updated BNB Chain price
    'SOL': 144.83,     // Updated Solana price
    'AVAX': 34.72,     // Updated Avalanche price
    'ARB': 1.10,       // Updated Arbitrum price
    'OP': 2.78,        // Updated Optimism price
    'NEAR': 5.91       // Updated Near Protocol price
  });

  // Refresh conversion rates using Chainlink price feeds
  const refreshConversionRates = async () => {
    try {
      const updatedRates: Record<string, number> = { 'USDC': 1 };
      
      // Fetch latest prices from Chainlink for each supported token
      const currencies = ['ETH', 'MNT', 'MATIC', 'SOL', 'BNB', 'AVAX', 'ARB', 'OP', 'NEAR'];
      
      // Create array of promises for parallel fetching
      const pricePromises = currencies.map(async (currency) => {
        try {
          const price = await getChainlinkPrice(currency, 'USD');
          return { currency, price };
        } catch (error) {
          console.error(`Error fetching price for ${currency}:`, error);
          return { currency, price: conversionRates[currency] || 1 };
        }
      });
      
      // Wait for all price promises to resolve
      const results = await Promise.all(pricePromises);
      
      // Update rates object with results
      results.forEach(({ currency, price }) => {
        updatedRates[currency] = price;
      });
      
      // Update state with new rates
      setConversionRates(updatedRates);
      
      // Update pot value in USDC
      setPotInUSDC(pot * updatedRates['MNT']);
      
      // Log updated rates for debugging
      console.log('Updated rates from Chainlink:', updatedRates);
    } catch (error) {
      console.error('Error updating conversion rates:', error);
    }
  };
  
  // Periodically refresh rates (every 30 seconds)
  useEffect(() => {
    // Initial fetch
    refreshConversionRates();
    
    // Set interval for updates
    const interval = setInterval(() => {
      refreshConversionRates();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [pot]);

  // Toggle color theme
  const toggleColorTheme = () => {
    const nextIndex = (colorThemeIndex + 1) % mantleColorSchemes.length;
    setColorThemeIndex(nextIndex);
    setCurrentColorScheme(mantleColorSchemes[nextIndex]);
  };
  
  // Update win multiplier when bet amount changes
  useEffect(() => {
    setWinMultiplier(getWinMultiplier(betAmount));
  }, [betAmount]);

  // Increase pot growth rate over time to create excitement
  useEffect(() => {
    if (buttonPresses > 0) {
      // Exponential growth for a lottery-like experience
      // Each press increases pot growth rate more than the last
      const baseMultiplier = 1.0 + (buttonPresses * 0.02);
      const exponentialFactor = Math.min(1.5, 1 + (buttonPresses / 100));
      const newRate = Math.min(10.0, baseMultiplier * exponentialFactor);
      setPotGrowthRate(newRate);
    }
  }, [buttonPresses]);

  // Update win multiplier based on bet amount
  useEffect(() => {
    setWinMultiplier(getWinMultiplier(betAmount));
  }, [betAmount]);

  // Increment button presses
  const incrementButtonPresses = () => {
    setButtonPresses(prev => prev + 1);
  };

  // Add to pot with different currencies
  const addToPot = (amount: number, currency = 'MNT') => {
    try {
      // Validate inputs
      if (amount <= 0) {
        console.warn("Invalid contribution amount", amount);
        return;
      }
      
      // Ensure the currency exists in our rates
      if (!conversionRates[currency]) {
        console.warn(`Unsupported currency: ${currency}, defaulting to MNT`);
        currency = 'MNT';
      }
      
      // Convert amount to MNT if it's not already in MNT
      const mntAmount = currency === 'MNT' 
        ? amount 
        : amount * (conversionRates['MNT'] / conversionRates[currency]);

      // Calculate the 80/20 split
      const potContribution = mntAmount * 0.8; // 80% to pot
      const creatorFeeAmount = mntAmount * 0.2; // 20% to creator

      // Update the pot with 80% of the bet amount
      setPot(prev => prev + potContribution);
      
      // Track the creator fee (20%)
      setCreatorFees(prev => prev + creatorFeeAmount);
      
      // Track user contribution (full amount for user stats)
      setUserContribution(prev => prev + mntAmount);
      setTotalContributors(prev => prev + 1);
      
      // Calculate winning odds
      const dynamicWinRate = Math.min(
        MAX_WIN_RATE * 3, // Allow higher max with big bets
        BASE_WIN_RATE + (buttonPresses * 0.0005)
      ) * winMultiplier;
      
      // Check if user wins
      if (Math.random() < dynamicWinRate) {
        setUserHasWon(true);
      }
      
      // 30% chance to refresh rates on pot addition
      if (Math.random() < 0.3) {
        refreshConversionRates();
      }
    } catch (error) {
      console.error("Error adding to pot:", error);
      // Gracefully handle the error without breaking the app
      setPot(prev => prev + amount * 0.1);
    }
  };

  // Update AI message based on user interaction
  const updateAIMessage = (address: string) => {
    try {
      // Get user memory
      const userMemory = getUserMemory(address || DEMO_ADDRESS);
      
      // Generate a personalized message
      const newMessage = generateEnhancedMessage(address || DEMO_ADDRESS, {
        buttonPresses,
        potSize: pot,
        contributionAmount: userContribution,
        totalContributions: totalContributors
      });
      
      // Update message
      setAiMessage(newMessage);
    } catch (error) {
      console.error("Error updating AI message:", error);
      setAiMessage("Press the button to try your luck!");
    }
  };

  // Record button press with emotional pattern
  const recordPress = (
    address: string, 
    amount: number, 
    messageType: 'fomo' | 'greed' | 'urgency' | 'reward' | 'social'
  ) => {
    try {
      recordButtonPress(address, amount, messageType);
    } catch (error) {
      console.error("Error recording press:", error);
    }
  };

  // Claim reward - in production, this would trigger a blockchain transaction
  const claimReward = () => {
    if (userHasWon) {
      setIsClaimingReward(true);
      
      // Simulate transaction (would be a wallet signing flow in production)
      setTimeout(() => {
        // Simulate successful withdrawal
        setClaimSuccess(true);
        
        // Reset pot and game state
        setTimeout(() => {
          setPot(1.0); // Start with a small pot again
          setButtonPresses(0);
          setUserContribution(0);
          setUserHasWon(false);
          setIsClaimingReward(false);
          // Leave claimSuccess true for UX
        }, 2000);
      }, 2000);
    }
  };

  return (
    <MoneyButtonContext.Provider value={{
      pot,
      potInUSDC,
      buttonPresses,
      totalContributors,
      userContribution,
      creatorFees,
      incrementButtonPresses,
      addToPot,
      userHasWon,
      aiMessage,
      setAiMessage,
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
      toggleColorTheme,
      refreshConversionRates,
    }}>
      {children}
    </MoneyButtonContext.Provider>
  );
} 