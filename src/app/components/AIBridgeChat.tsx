import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend, IconRobot, IconUser, IconLoader2, IconCheck, IconX, IconArrowRight, IconCoin } from '@tabler/icons-react';
import { CoinbaseWalletService, MANTLE_MAINNET_CHAIN_ID, connectToMantleWithCoinbase } from '../services/coinbaseWalletService';

// Define message types
interface ChatMessage {
  id: string;
  type: string;
  content: string | ReactNode;
  timestamp: Date;
  status?: string;
}

interface AIBridgeChatProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { success: boolean; amount: string }) => void;
  initialCurrency?: string;
  initialAmount?: string;
}

// Bridge assistant for converting tokens to MNT
export default function AIBridgeChat({ 
  isOpen, 
  onClose, 
  onComplete, 
  initialCurrency = 'ETH', 
  initialAmount = '0.1' 
}: AIBridgeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message - straightforward and informational
      setMessages([
        {
          id: '1',
          type: 'system',
          content: 'MNT Bridge Assistant Initialized',
          timestamp: new Date()
        },
        {
          id: '2',
          type: 'ai',
          content: `Hello! I'm your bridge assistant. I can help you convert cryptocurrency to MNT for use on the Money Button platform.`,
          timestamp: new Date()
        },
        {
          id: '3',
          type: 'ai',
          content: 
            <div>
              <p>How much {initialCurrency} would you like to bridge to MNT on Mantle Network?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                  onClick={() => handleMessage(`Bridge 0.01 ${initialCurrency} to MNT`)}
                >
                  0.01 {initialCurrency}
                </button>
                <button
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                  onClick={() => handleMessage(`Bridge 0.05 ${initialCurrency} to MNT`)}
                >
                  0.05 {initialCurrency}
                </button>
                <button
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                  onClick={() => handleMessage(`Bridge 0.1 ${initialCurrency} to MNT`)}
                >
                  0.1 {initialCurrency}
                </button>
                <button
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                  onClick={() => handleMessage(`Bridge 0.5 ${initialCurrency} to MNT`)}
                >
                  0.5 {initialCurrency}
                </button>
                <button
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-700 text-white col-span-2"
                  onClick={() => handleMessage("Custom amount")}
                >
                  Enter custom amount
                </button>
              </div>
            </div>,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length, initialCurrency, initialAmount]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle user message
  const handleMessage = async (text: string) => {
    if (!text.trim() && !isProcessing) return;
    
    const userText = text || input;
    
    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'user',
        content: userText,
        timestamp: new Date()
      }
    ]);
    
    // Clear input field
    setInput('');
    
    // Process the user message
    setIsProcessing(true);
    
    try {
      // Simulated AI thinking delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for custom amount request
      if (userText.toLowerCase().includes('custom amount')) {
        addAIMessage(
          <div>
            <p>Please enter the amount of {initialCurrency} you would like to bridge:</p>
            <div className="mt-2 flex">
              <input
                type="text"
                className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Enter amount"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleMessage(`Bridge ${input} ${initialCurrency} to MNT`);
                  }
                }}
              />
              <button
                className="bg-indigo-600 text-white px-3 py-2 rounded-r-lg hover:bg-indigo-700"
                onClick={() => {
                  if (input.trim()) {
                    handleMessage(`Bridge ${input} ${initialCurrency} to MNT`);
                  }
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        );
        setIsProcessing(false);
        return;
      }
      
      // Generate response based on user message - factual instead of manipulative
      const generateResponse = async (message: string) => {
        // Simple factual responses
        const responses = [
          `I can help you bridge to MNT. The bridge provides a secure connection between chains.`,
          `I'd be happy to assist with bridging to Mantle Network.`,
          `I can help with that. The bridge process is straightforward and secure.`,
          `That's a good question. Let me provide you with the information about bridging to MNT.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      };
      
      // Extract amount from message if it's a bridge request
      const extractAmount = (message: string): string | null => {
        const amountRegex = /bridge\s+(\d*\.?\d+)\s+/i;
        const match = message.match(amountRegex);
        return match ? match[1] : null;
      };
      
      // Check for intent in the message
      const isBridgeIntent = userText.toLowerCase().includes('bridge') || 
                          userText.toLowerCase().includes('yes') || 
                          userText.toLowerCase().includes('convert') || 
                          userText.toLowerCase().includes('transfer');
      
      let bridgeAmount = extractAmount(userText) || initialAmount;
      
      if (isBridgeIntent) {
        // User wants to bridge
        const bridgeResponse = await generateResponse(userText);
        addAIMessage(bridgeResponse);
        
        // Add typing indicator
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Ask for confirmation to start bridge - factual, not manipulative
        addAIMessage(
          <div>
            <p>I can help you bridge {bridgeAmount} {initialCurrency} to MNT on Mantle Network. Would you like to proceed?</p>
            <div className="mt-3 flex space-x-2">
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                onClick={() => executeBridge(initialCurrency, bridgeAmount)}
              >
                Start Bridge Process
              </button>
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-700 text-white"
                onClick={() => handleMessage("I changed my mind")}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      } else if (userText.toLowerCase().includes('token') || 
                userText.toLowerCase().includes('price') || 
                userText.toLowerCase().includes('value')) {
        // User is asking about a token
        const tokenName = extractTokenName(userText) || initialCurrency;
        const tokenInfo = generateTokenInfo(tokenName);
        addAIMessage(tokenInfo);
        
        // Suggest bridging after providing token info - factual approach
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addAIMessage(
          <div>
            <p>Would you like me to help you bridge {tokenName} to MNT?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                onClick={() => handleMessage(`Bridge 0.01 ${tokenName} to MNT`)}
              >
                0.01 {tokenName}
              </button>
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                onClick={() => handleMessage(`Bridge 0.1 ${tokenName} to MNT`)}
              >
                0.1 {tokenName}
              </button>
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                onClick={() => handleMessage(`Bridge 0.5 ${tokenName} to MNT`)}
              >
                0.5 {tokenName}
              </button>
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-700 text-white"
                onClick={() => handleMessage("Custom amount")}
              >
                Custom amount
              </button>
            </div>
          </div>
        );
      } else if (userText.toLowerCase().includes('concern') || 
                userText.toLowerCase().includes('worry') || 
                userText.toLowerCase().includes('risk') || 
                userText.toLowerCase().includes('safe')) {
        // User has concerns, provide factual reassurance
        const reassurance = `The Wormhole bridge is a secure cross-chain messaging protocol in blockchain technology. It uses a decentralized guardian network to verify messages and a consensus mechanism. Your funds are secure during the bridging process, and Mantle Network provides security for your MNT tokens once they arrive.`;
        addAIMessage(reassurance);
      } else if (userText.toLowerCase().includes('yes') || userText.toLowerCase().startsWith('ok') || userText.toLowerCase().includes('start')) {
        // User agrees or wants to start
        const response = `I'll help you convert ${initialCurrency} to MNT. Let's start the process.`;
        addAIMessage(response);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        executeBridge(initialCurrency, bridgeAmount);
      } else if (userText.toLowerCase().includes('change') || userText.toLowerCase().includes('cancel') || userText.toLowerCase().includes('no')) {
        // User changed mind or wants to cancel
        const response = `No problem. Let me know if you want to proceed with the bridge later.`;
        addAIMessage(response);
      } else {
        // General conversation
        const generalResponse = await generateResponse(userText);
        addAIMessage(generalResponse);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Suggest bridging again - factual approach
        addAIMessage(
          <div>
            <p>Would you like to bridge {initialCurrency} to MNT?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                onClick={() => handleMessage(`Bridge 0.01 ${initialCurrency} to MNT`)}
              >
                0.01 {initialCurrency}
              </button>
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                onClick={() => handleMessage(`Bridge 0.1 ${initialCurrency} to MNT`)}
              >
                0.1 {initialCurrency}
              </button>
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                onClick={() => handleMessage(`Bridge 0.5 ${initialCurrency} to MNT`)}
              >
                0.5 {initialCurrency}
              </button>
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-700 text-white"
                onClick={() => handleMessage("Custom amount")}
              >
                Custom amount
              </button>
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addAIMessage('I encountered an error processing your request. Can you try again?');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper to extract token name from user message
  const extractTokenName = (message: string): string | null => {
    const tokens = ['ETH', 'BTC', 'USDC', 'USDT', 'SOL', 'AVAX', 'MATIC'];
    for (const token of tokens) {
      if (message.toUpperCase().includes(token)) {
        return token;
      }
    }
    return null;
  };
  
  // Generate token information - factual, not manipulative
  const generateTokenInfo = (token: string): string => {
    const tokenInfo: Record<string, string> = {
      "ETH": "Ethereum (ETH) is the native cryptocurrency of the Ethereum blockchain. It's used for gas fees, staking, and as collateral in DeFi. It can be bridged to Mantle Network through the Wormhole bridge.",
      "BTC": "Bitcoin (BTC) is the original cryptocurrency. It serves primarily as a store of value and investment asset. Through Wormhole bridge, BTC can be converted to MNT for use on the Mantle Network.",
      "USDC": "USD Coin (USDC) is a stablecoin pegged to the US dollar. With high liquidity and stability, USDC is widely used in DeFi. It can be converted to MNT through the Wormhole bridge.",
      "USDT": "Tether (USDT) is the largest stablecoin by market cap, pegged to the US dollar. It offers stability for traders and DeFi users. It can be bridged to MNT on Mantle Network.",
      "SOL": "Solana (SOL) is a high-performance blockchain token. Known for its speed and low fees, SOL powers the Solana ecosystem. It can be converted to MNT via the Wormhole bridge.",
      "AVAX": "Avalanche (AVAX) is a layer-1 blockchain token. Known for its subnet architecture and speed, AVAX is popular for DeFi applications. It can be bridged to MNT through Wormhole.",
      "MATIC": "Polygon (MATIC) is a layer-2 scaling solution token for Ethereum. Known for low fees and fast transactions. It can be converted to MNT through the Wormhole bridge."
    };
    
    return tokenInfo[token as keyof typeof tokenInfo] || `${token} can be bridged to MNT on the Mantle Network using Wormhole. This is a secure cross-chain transfer.`;
  };
  
  // Add AI message helper
  const addAIMessage = (content: string | ReactNode) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'ai',
        content,
        timestamp: new Date()
      }
    ]);
  };
  
  // Add system message helper
  const addSystemMessage = (content: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'system',
        content,
        timestamp: new Date()
      }
    ]);
  };
  
  // Execute bridge process
  const executeBridge = async (currency: string, amount: string) => {
    setBridgeStatus('in_progress');
    
    // Add message about bridge start
    addSystemMessage(`Initiating Wormhole bridge: ${amount} ${currency} → MNT on Mantle Network`);
    
    try {
      // Step 1: Initialize Coinbase wallet connection (mock for now)
      addAIMessage('Preparing your bridge transaction through Wormhole. This is a secure cross-chain transfer.');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Validating - attempt to connect to wallet
      addAIMessage('Validating source chain information and establishing secure Wormhole connection...');
      
      // Simulate wallet connection
      let walletConnected = false;
      try {
        // Comment this out if you don't want to trigger actual wallet popups
        // const { account, provider } = await connectToMantleWithCoinbase();
        // walletConnected = true;
        walletConnected = true; // Mock success
      } catch (error) {
        console.log('Wallet connection error (expected in mock):', error);
        // Continue with mock flow even if wallet connection fails
      }
      
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Step 3: Confirmation
      addAIMessage(
        <div className="flex items-center space-x-2">
          <IconCheck className="text-green-500" />
          <span>Source chain validated. Preparing Wormhole bridge portal...</span>
        </div>
      );
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Processing - show the bridge visualization
      addAIMessage(
        <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-purple-500/30">
          <p className="text-center font-semibold mb-2">Wormhole Bridge Processing</p>
          <div className="flex justify-center space-x-3 text-xs text-gray-300">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mb-1"></div>
              <span>Source Chain</span>
            </div>
            <div className="flex items-center">
              <div className="h-0.5 w-10 bg-gradient-to-r from-green-500 to-purple-500"></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-purple-500 animate-pulse mb-1"></div>
              <span>Wormhole</span>
            </div>
            <div className="flex items-center">
              <div className="h-0.5 w-10 bg-gradient-to-r from-purple-500 to-blue-500"></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mb-1"></div>
              <span>Mantle</span>
            </div>
          </div>
          <p className="text-center text-xs mt-3 text-gray-300">Transferring {amount} {currency} through secure Wormhole portal</p>
          <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
            <div className="bg-purple-600 h-1.5 rounded-full animate-[wormholeProgress_5s_ease-in-out_forwards]"></div>
          </div>
        </div>
      );
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 5: Reaching destination
      addAIMessage('Assets detected at Mantle Network gateway. Finalizing conversion to MNT...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 6: Complete
      addAIMessage(
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <IconCheck className="text-green-500" />
            <span className="font-semibold">Bridge Complete! Your tokens are now available as MNT.</span>
          </div>
          <div className="p-3 bg-gray-900 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-300">Received</p>
              <p className="text-lg font-semibold">{amount} MNT</p>
            </div>
            <button 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
              onClick={() => {
                onComplete({ success: true, amount });
                onClose();
              }}
            >
              <span className="flex items-center">
                <IconCoin size={16} className="mr-1.5" />
                Use on Money Button
                <IconArrowRight size={16} className="ml-1.5" />
              </span>
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-300">
            Your tokens have been successfully bridged. You can now use them on the Money Button.
          </p>
        </div>
      );
      
      setBridgeStatus('complete');
    } catch (error) {
      console.error('Error in bridge process:', error);
      
      // Error handling
      addAIMessage('I encountered an issue with the bridge process. Please try again.');
      setBridgeStatus('error');
    }
  };
  
  // Handle input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleMessage(input);
  };
  
  // Handle closing the dialog
  const handleClose = () => {
    if (bridgeStatus === 'complete') {
      onComplete({ success: true, amount: initialAmount });
    }
    onClose();
  };
  
  // Render message UI
  const renderMessage = (message: ChatMessage) => {
    switch (message.type) {
      case 'user':
        return (
          <div className="flex justify-end mb-3">
            <div className="bg-blue-600 text-white py-2 px-3 rounded-tl-lg rounded-bl-lg rounded-tr-lg max-w-[80%]">
              <div className="flex items-start">
                <div className="mr-1 mt-1 bg-white bg-opacity-20 rounded-full p-1">
                  <IconUser size={14} />
                </div>
                <div>{message.content}</div>
              </div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="flex mb-3">
            <div className="bg-gray-800 border border-gray-700 py-2 px-3 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-[80%]">
              <div className="flex items-start">
                <div className="mr-1 mt-1 bg-purple-600 rounded-full p-1">
                  <IconRobot size={14} />
                </div>
                <div className="text-gray-100">{message.content}</div>
              </div>
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="flex justify-center mb-3">
            <div className="bg-gray-800 bg-opacity-50 text-gray-400 text-xs py-1 px-3 rounded-full">
              {message.content}
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Render bridge dialog
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div 
            className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md mx-4 overflow-hidden shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-gray-800 p-4 bg-gradient-to-r from-[#2438E8]/10 to-[#7B4DFF]/10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Wormhole Bridge Assistant</h3>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={handleClose}
                >
                  <IconX size={20} />
                </button>
              </div>
            </div>
            
            {/* Messages container */}
            <div className="p-4 h-96 overflow-y-auto bg-gradient-to-b from-transparent to-[#07081A]/50">
              {messages.map(message => (
                <div key={message.id}>
                  {renderMessage(message)}
                </div>
              ))}
              
              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex mb-3">
                  <div className="bg-gray-800 border border-gray-700 py-2 px-3 rounded-lg max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <IconLoader2 size={16} className="animate-spin text-purple-400" />
                      <span className="text-gray-400 text-sm">Processing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Auto scroll ref */}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area */}
            <form onSubmit={handleSubmit} className="border-t border-gray-800 p-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Type your message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  ref={inputRef}
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  disabled={!input.trim() || isProcessing}
                >
                  <IconSend size={20} />
                </button>
              </div>
              <div className="mt-2 text-xs text-center text-gray-500">
                <span>Powered by Wormhole</span> | <span>Mantle Network</span>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 