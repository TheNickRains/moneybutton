'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCoin, IconUser, IconRefresh } from '@tabler/icons-react';

interface ActivityLogProps {
  colorScheme: any;
}

interface ActivityItem {
  id: string;
  type: 'bet' | 'win' | 'join';
  userName: string;
  amount?: string;
  currency?: string;
  timestamp: number;
  walletAddress: string;
}

export default function ActivityLog({ colorScheme }: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Sample user names for demo
  const userNames = [
    'CryptoWhale', 'TokenMaster', 'BlockchainBoss', 'DeFiKing', 'SatoshiFan',
    'EtherQueen', 'DogeRider', 'NFTCollector', 'ChainLink', 'MoonShot'
  ];
  
  // Generate a random shortened wallet address
  const getShortAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Listen for global events
  useEffect(() => {
    // Mock data generator for demo
    const generateMockActivity = () => {
      const randomUserName = userNames[Math.floor(Math.random() * userNames.length)];
      const randomWallet = `0x${Math.random().toString(16).substring(2, 12)}...${Math.random().toString(16).substring(2, 6)}`;
      const currencies = ['MNT', 'USDC', 'ETH', 'MATIC', 'BNB', 'SOL'];
      const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
      const randomAmount = (Math.random() * 0.1).toFixed(3);
      
      const types: ('bet' | 'win' | 'join')[] = ['bet', 'join'];
      // Make 'win' rare
      const typeIndex = Math.random() > 0.97 ? 1 : 0;
      const itemType = typeIndex === 1 ? 'win' : types[0];
      
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type: itemType,
        userName: randomUserName,
        amount: randomAmount,
        currency: randomCurrency,
        timestamp: Date.now(),
        walletAddress: randomWallet
      };

      // Add new activity and keep only the most recent 30
      setActivities(prev => {
        const updated = [newActivity, ...prev];
        if (updated.length > 30) {
          return updated.slice(0, 30);
        }
        return updated;
      });
    };

    // Real activity handler for production
    const handleRealActivity = (event: CustomEvent) => {
      const activityData = event.detail;
      setActivities(prev => {
        const updated = [activityData, ...prev];
        if (updated.length > 30) {
          return updated.slice(0, 30);
        }
        return updated;
      });
    };
    
    // Demo mode: generate random activities
    const interval = setInterval(generateMockActivity, Math.random() * 3000 + 2000);
    
    // Production mode: listen for real activity events
    window.addEventListener('activity-event' as any, handleRealActivity as any);

    return () => {
      clearInterval(interval);
      window.removeEventListener('activity-event' as any, handleRealActivity as any);
    };
  }, [userNames]);

  // Auto-scroll to newest activities
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [activities]);

  // Format time difference
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 120) return '1m ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 7200) return '1h ago';
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Clear log (useful for testing)
  const clearLog = () => {
    setActivities([]);
  };

  return (
    <motion.div 
      className="fixed left-4 top-32 bottom-20 w-64 rounded-lg overflow-hidden shadow-lg z-10 hidden md:block"
      style={{ 
        backgroundColor: `${colorScheme.primary}15`,
        border: `1px solid ${colorScheme.primary}30`,
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-3 font-medium flex justify-between items-center" 
        style={{ 
          borderBottom: `1px solid ${colorScheme.primary}30`,
          backgroundColor: `${colorScheme.primary}25`,
          color: colorScheme.text
        }}
      >
        <div className="flex items-center">
          <IconUser size={16} className="mr-2" />
          <span>Activity Log</span>
        </div>
        <motion.button
          onClick={clearLog}
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
          style={{ color: `${colorScheme.text}80` }}
        >
          <IconRefresh size={16} />
        </motion.button>
      </div>
      
      <div 
        ref={logContainerRef}
        className="h-full overflow-y-auto flex flex-col-reverse px-2 pt-2 pb-4 max-h-[70vh]"
        style={{ color: colorScheme.text }}
      >
        <AnimatePresence initial={false}>
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              className="mb-2 p-2 rounded-md"
              style={{ 
                backgroundColor: activity.type === 'win' 
                  ? `${colorScheme.accent}20` 
                  : `${colorScheme.primary}10`
              }}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">
                  {activity.userName}
                </span>
                <span className="text-xs opacity-70">
                  {getTimeAgo(activity.timestamp)}
                </span>
              </div>
              
              <div className="text-xs mt-1">
                {activity.type === 'bet' && (
                  <div className="flex items-center">
                    <span>Bet </span>
                    <span className="mx-1 font-semibold" style={{ color: colorScheme.accent }}>
                      {activity.amount} {activity.currency}
                    </span>
                  </div>
                )}
                
                {activity.type === 'win' && (
                  <div className="flex items-center">
                    <IconCoin size={12} className="mr-1" style={{ color: colorScheme.accent }} />
                    <span className="font-bold" style={{ color: colorScheme.accent }}>
                      Won the jackpot!
                    </span>
                  </div>
                )}
                
                {activity.type === 'join' && (
                  <div className="flex items-center">
                    <span>Joined the game</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {activities.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-50 text-sm">
            No activity yet
          </div>
        )}
      </div>
    </motion.div>
  );
} 