'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconClock, IconFlame, IconTrendingUp, IconUsers, 
  IconAlertTriangle, IconCoin, IconPlayerPlay 
} from '@tabler/icons-react';

interface UserFeedbackProps {
  message: string;
  messageType: 'fomo' | 'greed' | 'urgency' | 'reward' | 'social';
  colorScheme: any;
  isVisible: boolean;
}

/**
 * Component to display personalized user feedback with emotional triggers
 */
export default function UserFeedback({ 
  message, 
  messageType = 'fomo',
  colorScheme,
  isVisible
}: UserFeedbackProps) {
  const [showEmoji, setShowEmoji] = useState<boolean>(true);

  // Tailor the message display based on the message type
  useEffect(() => {
    if (message) {
      setShowEmoji(true);
    }
  }, [message]);

  // Get the appropriate icon for each message type
  const getMessageIcon = () => {
    switch (messageType) {
      case 'fomo':
        return <IconClock size={20} style={{ color: colorScheme.accent }} />;
      case 'greed':
        return <IconCoin size={20} style={{ color: colorScheme.accent }} />;
      case 'urgency':
        return <IconAlertTriangle size={20} style={{ color: colorScheme.accent }} />;
      case 'reward':
        return <IconTrendingUp size={20} style={{ color: colorScheme.accent }} />;
      case 'social':
        return <IconUsers size={20} style={{ color: colorScheme.accent }} />;
      default:
        return <IconFlame size={20} style={{ color: colorScheme.accent }} />;
    }
  };
  
  // Get appropriate animations based on message type
  const getMessageAnimation = () => {
    switch (messageType) {
      case 'urgency':
        return {
          animate: { 
            scale: [1, 1.02, 1], 
            transition: { repeat: Infinity, duration: 0.8 } 
          }
        };
      case 'fomo':
        return {
          animate: { 
            opacity: [1, 0.8, 1], 
            transition: { repeat: Infinity, duration: 1.2 } 
          }
        };
      case 'greed':
        return {
          animate: { 
            y: [0, -2, 0], 
            transition: { repeat: Infinity, duration: 1.5 } 
          }
        };
      default:
        return {};
    }
  };

  // Get background styling based on message type
  const getBackgroundStyle = () => {
    switch (messageType) {
      case 'urgency':
        return {
          backgroundColor: `${colorScheme.accent}20`,
          borderLeft: `3px solid ${colorScheme.accent}`
        };
      case 'reward':
        return {
          backgroundColor: `${colorScheme.primary}25`,
          borderLeft: `3px solid ${colorScheme.primary}`
        };
      case 'greed':
        return {
          backgroundColor: `${colorScheme.success}15`,
          borderLeft: `3px solid ${colorScheme.success}`
        };
      case 'fomo':
        return {
          backgroundColor: `${colorScheme.warning}15`,
          borderLeft: `3px solid ${colorScheme.warning}`
        };
      case 'social':
        return {
          backgroundColor: `${colorScheme.info}15`,
          borderLeft: `3px solid ${colorScheme.info}`
        };
      default:
        return {
          backgroundColor: `${colorScheme.primary}15`,
          borderLeft: `3px solid ${colorScheme.primary}`
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div
          className="fixed bottom-6 right-6 max-w-sm rounded-lg shadow-lg p-4 z-50"
          style={{
            ...getBackgroundStyle(),
            color: colorScheme.text
          }}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          {...getMessageAnimation()}
        >
          <div className="flex items-start">
            <div className="mr-3 mt-1">
              {getMessageIcon()}
            </div>
            <div>
              <p className="text-sm font-medium">
                {message}
              </p>
              
              {/* Call-to-action button for certain message types */}
              {(messageType === 'fomo' || messageType === 'urgency') && (
                <motion.button
                  className="mt-2 text-xs flex items-center py-1 px-2 rounded"
                  style={{ 
                    backgroundColor: `${colorScheme.accent}50`,
                    color: colorScheme.text
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconPlayerPlay size={12} className="mr-1" />
                  Press Now
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 