'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCoin, IconArrowUp } from '@tabler/icons-react';

interface ActivityFeedProps {
  colorScheme: any;
  ephemeral?: boolean;
}

interface ActivityMessage {
  id: string;
  type: 'bet' | 'win' | 'join';
  userName: string;
  amount?: string;
  currency?: string;
  walletAddress: string;
  timestamp?: number;
}

export default function ActivityFeed({ colorScheme, ephemeral = false }: ActivityFeedProps) {
  const [messages, setMessages] = useState<ActivityMessage[]>([]);
  const [ephemeralMessages, setEphemeralMessages] = useState<ActivityMessage[]>([]);
  const [isProduction] = useState(process.env.NODE_ENV === 'production');
  
  // User names for demo mode
  const userNames = [
    'User_1234', 'User_5678', 'User_9012', 'User_3456', 'User_7890',
    'DeFiKing', 'CryptoQueen', 'BlockchainBob', 'HashMaster', 'TokenTrader'
  ];
  
  // Add dummy data in development mode
  useEffect(() => {
    if (!isProduction && !ephemeral) {
      // Original demo data generation for non-ephemeral mode
      const interval = setInterval(() => {
        const newMessage: ActivityMessage = {
          id: Date.now().toString(),
          type: Math.random() > 0.3 ? 'bet' : Math.random() > 0.5 ? 'win' : 'join',
          userName: userNames[Math.floor(Math.random() * userNames.length)],
          walletAddress: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
          timestamp: Date.now()
        };
        
        if (newMessage.type === 'bet' || newMessage.type === 'win') {
          newMessage.amount = (Math.random() * 10).toFixed(Math.floor(Math.random() * 4));
          newMessage.currency = 'MNT';
        }
        
        setMessages(prev => [newMessage, ...prev].slice(0, 50));
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [userNames, messages.length, isProduction, ephemeral]);
  
  // Add activity event listener for real events
  useEffect(() => {
    const handleActivityEvent = (e: any) => {
      const newMessage = e.detail as ActivityMessage;
      
      // Add to main message list for both modes
      setMessages(prev => [newMessage, ...prev].slice(0, 50));
      
      // If in ephemeral mode, add to ephemeral messages with auto-removal
      if (ephemeral) {
        setEphemeralMessages(prev => [newMessage, ...prev]);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          setEphemeralMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
        }, 5000);
      }
    };
    
    window.addEventListener('activity-event', handleActivityEvent);
    
    return () => {
      window.removeEventListener('activity-event', handleActivityEvent);
    };
  }, [ephemeral]);
  
  // Add initial demo data for ephemeral mode
  useEffect(() => {
    if (ephemeral && !isProduction) {
      // Seed data for the ephemeral display
      const seedData: ActivityMessage[] = [
        {
          id: '1',
          type: 'bet',
          userName: 'User_1234',
          amount: '0.050',
          currency: 'MNT',
          walletAddress: '0x1234...5678',
          timestamp: Date.now() - 10000
        },
        {
          id: '2',
          type: 'win',
          userName: 'User_5678',
          amount: '10.000',
          currency: 'MNT',
          walletAddress: '0x5678...9012',
          timestamp: Date.now() - 7000
        },
        {
          id: '3',
          type: 'join',
          userName: 'User_9012',
          walletAddress: '0x9012...3456',
          timestamp: Date.now() - 3000
        }
      ];
      
      // Trigger demo events staggered
      seedData.forEach((message, index) => {
        setTimeout(() => {
          const event = new CustomEvent('activity-event', { detail: message });
          window.dispatchEvent(event);
        }, index * 2000 + 1000); // Start after 1 second, stagger by 2 seconds
      });
      
      // Continue generating random events for ephemeral demo
      const interval = setInterval(() => {
        const newMessage: ActivityMessage = {
          id: Date.now().toString(),
          type: Math.random() > 0.3 ? 'bet' : Math.random() > 0.5 ? 'win' : 'join',
          userName: userNames[Math.floor(Math.random() * userNames.length)],
          walletAddress: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
          timestamp: Date.now()
        };
        
        if (newMessage.type === 'bet' || newMessage.type === 'win') {
          newMessage.amount = (Math.random() * 10).toFixed(Math.floor(Math.random() * 4));
          newMessage.currency = 'MNT';
        }
        
        const event = new CustomEvent('activity-event', { detail: newMessage });
        window.dispatchEvent(event);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [ephemeral, isProduction, userNames]);
  
  // Render ephemeral messages (pop-up style from bottom)
  if (ephemeral) {
    return (
      <div className="flex flex-col-reverse space-y-reverse space-y-2 max-w-xs">
        <AnimatePresence>
          {ephemeralMessages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 50, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`rounded-lg p-3 shadow-lg w-full max-w-xs backdrop-blur-sm border
                ${message.type === 'bet' ? 'bg-indigo-900/80 border-indigo-500/50' : 
                  message.type === 'win' ? 'bg-green-900/80 border-green-500/50' : 
                  'bg-blue-900/80 border-blue-500/50'}`}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                mass: 0.5
              }}
            >
              {renderEphemeralMessageContent(message)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }
  
  // Original sidebar view
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
  
  // Helper function to render message content for ephemeral display with improved styling
  function renderEphemeralMessageContent(message: ActivityMessage) {
    const elapsed = message.timestamp ? getTimeAgo(message.timestamp) : '';
    
    switch (message.type) {
      case 'bet':
        return (
          <div className="flex items-start">
            <div className="bg-indigo-500 rounded-full p-1.5 mr-2.5 shadow-lg">
              <IconCoin size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm text-indigo-200">{message.userName}</span>
                {elapsed && <span className="text-[10px] text-indigo-300/60">{elapsed}</span>}
              </div>
              <div className="text-sm text-white font-medium mt-1">
                Bet {message.amount} {message.currency}
              </div>
              <div className="text-xs bg-black/20 px-2 py-1 rounded mt-1 flex justify-between">
                <span>Pot <span className="text-green-400">+{message.amount && (parseFloat(message.amount) * 0.8).toFixed(4)}</span></span>
                <span>Creator <span className="text-blue-400">+{message.amount && (parseFloat(message.amount) * 0.2).toFixed(4)}</span></span>
              </div>
            </div>
          </div>
        );
      
      case 'win':
        return (
          <div className="flex items-start">
            <div className="bg-green-500 rounded-full p-1.5 mr-2.5 shadow-lg animate-pulse">
              <IconArrowUp size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm text-green-200">{message.userName}</span>
                {elapsed && <span className="text-[10px] text-green-300/60">{elapsed}</span>}
              </div>
              <div className="text-sm text-white font-medium mt-1 flex items-center">
                <span className="text-lg mr-1">🎉</span> 
                Won {message.amount} {message.currency}!
              </div>
              <div className="text-xs bg-black/20 px-2 py-1 rounded mt-1">
                <span className="text-gray-300">The pot has been reset to 0 MNT</span>
              </div>
            </div>
          </div>
        );
      
      case 'join':
        return (
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full p-1.5 mr-2.5 shadow-lg">
              <IconArrowUp size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm text-blue-200">{message.userName}</span>
                {elapsed && <span className="text-[10px] text-blue-300/60">{elapsed}</span>}
              </div>
              <div className="text-sm text-white font-medium mt-1">
                Joined the game
              </div>
              <div className="text-xs bg-black/20 px-2 py-1 rounded mt-1">
                <span className="text-gray-300">New player has entered the game</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div className="text-xs text-gray-300">Unknown activity</div>;
    }
  }
  
  // Helper function to calculate time ago
  function getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
} 