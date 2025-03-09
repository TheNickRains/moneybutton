'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BridgeTransaction, SourceChain } from '../../services/universalBridgeService';
import { ChatMessage } from './types';
import { useMessages } from './hooks/useMessages';
import { useWallet } from './hooks/useWallet';
import { useBridgeProcess } from './hooks/useBridgeProcess';
import { useTransactionHistory } from './hooks/useTransactionHistory';

// UI Components
import ChatInterface from './components/ChatInterface';
import WalletConnection from './components/WalletConnection';
import TransactionHistory from './components/TransactionHistory';
import ChainSelector from './components/ChainSelector';
import TokenSelector from './components/TokenSelector';
import AmountInput from './components/AmountInput';
import { AnimatePresence, motion } from 'framer-motion';

// Main AgentBridge component - now acting as a facade/coordinator
interface AgentBridgeProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { success: boolean; amount: string; token: string }) => void;
}

export default function AgentBridge({ 
  isOpen, 
  onClose, 
  onComplete 
}: AgentBridgeProps) {
  // Core state managed here, with logic delegated to hooks and sub-components
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Extracted message logic
  const { 
    messages, 
    addUserMessage, 
    addAIMessage, 
    addSystemMessage,
    getFormattedChatHistory 
  } = useMessages();
  
  // Extracted wallet connection logic
  const {
    walletConnected,
    walletAddress,
    walletError,
    connectWallet,
    selectedChain,
    setSelectedChain
  } = useWallet();
  
  // Extracted token and amount management
  const {
    selectedToken,
    setSelectedToken,
    bridgeAmount,
    setBridgeAmount,
    tokenBalance,
    handleTokenSelection,
    handleAmountConfirmation,
    startBridgeProcess
  } = useBridgeProcess(selectedChain, walletConnected, walletAddress, addAIMessage, addSystemMessage, onComplete);
  
  // Extracted transaction history logic
  const {
    showHistory,
    toggleHistory,
    transactionHistory
  } = useTransactionHistory();
  
  // Core refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus input field when component is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message and initial UI rendered by ChatInterface
      addSystemMessage('Bridge to Mantle Assistant Initialized');
      
      // Add initial welcome message
      try {
        // Set a default welcome message in case there's an error
        const defaultWelcome = `Hello! I'm your AI bridge assistant. I can help you convert tokens from any supported chain to the Mantle Network. Simply tell me what you want to bridge, or select a source chain to begin.`;
        
        // Try to add an AI message, but handle failures gracefully
        addAIMessage(defaultWelcome);
        
        // Present the chain selector UI component
        setTimeout(() => {
          addAIMessage(
            <ChainSelector onSelect={setSelectedChain} />
          );
        }, 500);
      } catch (error) {
        console.error('Error initializing bridge assistant:', error);
        // Fall back to simple text instructions if component rendering fails
        addAIMessage(`Hello! I'm your AI bridge assistant. I can help you convert tokens from any supported chain to the Mantle Network. 
        
Please select a source chain to begin.`);
      }
    }
  }, [isOpen, messages.length]);

  // Handle form submission
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    addUserMessage(input);
    
    // Process the input - delegated to ChatInterface
    processUserMessage(input);
    
    // Clear input
    setInput('');
  };
  
  // Process user messages
  const processUserMessage = async (message: string) => {
    setIsProcessing(true);
    
    try {
      // Process the message with the ChatInterface
      await ChatInterface.processMessage({
        message,
        selectedChain,
        selectedToken,
        walletConnected,
        bridgeAmount,
        addAIMessage,
        addSystemMessage,
        getFormattedChatHistory,
        handleChainSelection: setSelectedChain,
        handleTokenSelection,
        setIsProcessing
      });
    } catch (error) {
      console.error('Error processing message:', error);
      addAIMessage(
        "I apologize, but I encountered an error processing your message. Please try again with a simpler request."
      );
      setIsProcessing(false);
    }
  };

  // Handle close
  const handleClose = () => {
    onClose();
  };

  // Render the component
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dark overlay */}
          <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Bridge Modal Container - Make this fit in viewport */}
          <motion.div 
            className="relative w-full max-w-4xl bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] max-h-[90dvh]"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center">
                <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 7H7v6h6V7z" />
                    <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">Bridge to Mantle</h2>
                  <p className="text-xs text-gray-400 mt-0.5">AI-powered cross-chain bridge • Destination: Mantle Network</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body - Use flex with overflow control */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side - Bridge Interface */}
              <div className="w-1/2 xl:w-3/5 flex flex-col overflow-hidden border-r border-gray-700">
                {/* Chat Area - Make this scrollable */}
                <div className="flex-1 overflow-y-auto p-3">
                  <ChatInterface
                    messages={messages}
                    selectedChain={selectedChain}
                    selectedToken={selectedToken}
                    walletConnected={walletConnected}
                    bridgeAmount={bridgeAmount}
                    onChainSelect={setSelectedChain}
                    onTokenSelect={handleTokenSelection}
                    onConnectWallet={connectWallet}
                    onAmountConfirm={handleAmountConfirmation}
                    onStartBridge={startBridgeProcess}
                  />
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Right Side - Transaction History */}
              <div className="w-1/2 xl:w-2/5 p-3 overflow-y-auto">
                <button
                  onClick={toggleHistory}
                  className="text-gray-400 hover:text-white p-1 transition-colors"
                  aria-label="Transaction History"
                >
                  <span className="sr-only">History</span>
                  <span className="relative">
                    <TransactionHistory 
                      isVisible={showHistory}
                      transactions={transactionHistory}
                    />
                  </span>
                </button>
              </div>
            </div>
            
            {/* Input area */}
            <div className="p-2 border-t border-gray-800">
              <form onSubmit={handleInputSubmit} className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !input.trim()}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  aria-label="Send message"
                >
                  {isProcessing ? (
                    <span className="animate-spin">⌛</span>
                  ) : (
                    <span>Send</span>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 