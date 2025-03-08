'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCoin, IconArrowUp } from '@tabler/icons-react';

interface ActivityFeedProps {
  colorScheme: any;
}

interface ActivityMessage {
  id: string;
  type: 'bet' | 'win' | 'join';
  userName: string;
  amount?: string;
  currency?: string;
  walletAddress: string;
}

export default function ActivityFeed({ colorScheme }: ActivityFeedProps) {
  const [messages, setMessages] = useState<ActivityMessage[]>([]);
  const [isProduction] = useState(process.env.NODE_ENV === 'production');
  
  // Sample user names for demo
  const userNames = [
    'CryptoWhale', 'TokenMaster', 'BlockchainBoss', 'DeFiKing', 'SatoshiFan',
    'EtherQueen', 'DogeRider', 'NFTCollector', 'ChainLink', 'MoonShot'
  ];

  // Listen for global events
  useEffect(() => {
    // Real activity handler for both production and development
    const handleRealActivity = (event: CustomEvent) => {
      const activityData = event.detail;
      
      // Add new message
      setMessages(prev => [...prev, activityData]);
      
      // Remove message after display time
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== activityData.id));
      }, 4000);
    };
    
    // Listen for real activity events
    window.addEventListener('activity-event' as any, handleRealActivity as any);
    
    // Only in development mode, generate some mock activities
    let interval: ReturnType<typeof setTimeout> | null = null;
    
    if (!isProduction) {
      // Mock data generator for demo only
      const generateMockActivity = () => {
        // Skip if we already have too many messages to avoid overwhelming the UI
        if (messages.length > 5) return;
        
        const randomUserName = userNames[Math.floor(Math.random() * userNames.length)];
        const randomWallet = `0x${Math.random().toString(16).substring(2, 12)}...${Math.random().toString(16).substring(2, 6)}`;
        const currencies = ['MNT', 'USDC', 'ETH', 'MATIC', 'BNB', 'SOL'];
        const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
        const randomAmount = (Math.random() * 0.1).toFixed(3);
        
        // In demo mode, show mostly bets, rarely wins, and occasionally new users
        let itemType: 'bet' | 'win' | 'join' = 'bet';
        const typeRandom = Math.random();
        if (typeRandom > 0.95) {
          itemType = 'win';
        } else if (typeRandom > 0.85) {
          itemType = 'join';
        }
        
        const newActivity: ActivityMessage = {
          id: Date.now().toString(),
          type: itemType,
          userName: randomUserName,
          amount: randomAmount,
          currency: randomCurrency,
          walletAddress: randomWallet
        };

        // Add new message
        setMessages(prev => [...prev, newActivity]);
        
        // Remove message after display time
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== newActivity.id));
        }, 4000);
      };
      
      // Demo mode: generate random activities more frequently for better demonstration
      interval = setInterval(generateMockActivity, Math.random() * 3000 + 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('activity-event' as any, handleRealActivity as any);
    };
  }, [userNames, messages.length, isProduction]);

  return (
    <div className="pointer-events-none z-10 w-full">
      <div className="flex flex-col items-start space-y-2 max-w-xs w-full">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className="px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm text-xs w-full"
              style={{ 
                backgroundColor: message.type === 'win' 
                  ? `${colorScheme.accent}30` 
                  : `${colorScheme.primary}40`,
                borderLeft: `2px solid ${message.type === 'win' ? colorScheme.accent : colorScheme.primary}`,
                color: colorScheme.text
              }}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center">
                <span className="font-medium truncate max-w-[80px]">{message.userName}</span>
                
                {message.type === 'bet' && message.amount && message.currency && (
                  <div className="flex items-center ml-1.5">
                    <IconArrowUp size={10} className="mx-0.5" style={{ color: colorScheme.accent }} />
                    <span className="font-semibold" style={{ color: colorScheme.accent }}>
                      {message.amount} {message.currency}
                    </span>
                  </div>
                )}
                
                {message.type === 'win' && (
                  <div className="flex items-center ml-1.5">
                    <IconCoin size={10} className="mr-0.5" style={{ color: colorScheme.accent }} />
                    <span className="font-bold" style={{ color: colorScheme.accent }}>
                      Won!
                    </span>
                  </div>
                )}
                
                {message.type === 'join' && (
                  <span className="ml-1.5 opacity-80">joined</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
} 