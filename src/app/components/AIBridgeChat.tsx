import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend, IconRobot, IconUser, IconLoader2, IconCheck, IconX } from '@tabler/icons-react';

// Simplified version for demo purposes
export default function AIBridgeChat({ isOpen, onClose, onComplete, initialCurrency = 'ETH', initialAmount = '0.1' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setMessages([
        {
          id: '1',
          type: 'system',
          content: 'AI Wormhole Bridge initialized',
          timestamp: new Date()
        },
        {
          id: '2',
          type: 'ai',
          content: `Hello! I'm your AI bridge assistant. I can help you convert any cryptocurrency to MNT for Money Button.`,
          timestamp: new Date()
        },
        {
          id: '3',
          type: 'ai',
          content: 
            <div>
              <p>Would you like to bridge {initialAmount} {initialCurrency} to MNT?</p>
              <div className="mt-3 flex space-x-2">
                <button
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                  onClick={() => handleMessage(`Yes, bridge ${initialAmount} ${initialCurrency} to MNT`)}
                >
                  Yes, bridge it
                </button>
                <button
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-700 text-white"
                  onClick={() => handleMessage("I want to do something else")}
                >
                  No, something else
                </button>
              </div>
            </div>,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, initialCurrency, initialAmount]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle user message
  const handleMessage = async (text) => {
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
    setInput('');
    setIsProcessing(true);
    
    // Add AI "thinking" message
    const thinkingId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev, 
      {
        id: thinkingId,
        type: 'ai',
        content: 'Thinking...',
        status: 'thinking',
        timestamp: new Date()
      }
    ]);
    
    try {
      // Demo logic - determine if this is a bridge request
      if (userText.toLowerCase().includes('bridge') || userText.toLowerCase().includes('yes')) {
        // Simulate bridge request processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update thinking message with route analysis
        setMessages(prev => 
          prev.map(msg => 
            msg.id === thinkingId 
              ? { 
                  ...msg, 
                  content: `I'll help you bridge ${initialAmount} ${initialCurrency} to MNT. Let me analyze the best route...`, 
                  status: 'complete' 
                } 
              : msg
          )
        );
        
        // Add route details
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'ai',
            content: 
              <div>
                <p>I've found the optimal route with lowest fees and fastest processing time:</p>
                <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white">1</div>
                    <div className="ml-3">
                      <p>{initialCurrency} on {initialCurrency === 'ETH' ? 'Ethereum' : 'Source Chain'}</p>
                    </div>
                  </div>
                  <div className="h-6 border-l border-gray-600 ml-3.5"></div>
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white">2</div>
                    <div className="ml-3">
                      <p>MNT on Mantle Network</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Est. Fee:</span>
                    <p>${(Math.random() * 5 + 3).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Est. Time:</span>
                    <p>5-10 min</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Risk Level:</span>
                    <p className="text-green-400">Low</p>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-600 text-white"
                    onClick={() => executeBridge(initialCurrency, initialAmount)}
                  >
                    Start Bridge
                  </button>
                  <button
                    className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-700 text-white"
                    onClick={() => handleMessage("Cancel bridge")}
                  >
                    Cancel
                  </button>
                </div>
              </div>,
            timestamp: new Date()
          }
        ]);
      } else if (userText.toLowerCase().includes('cancel')) {
        // Handle cancellation
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'ai',
            content: "No problem. I've cancelled the bridge request. Is there anything else I can help you with?",
            timestamp: new Date()
          }
        ]);
      } else {
        // General response
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMessages(prev => 
          prev.map(msg => 
            msg.id === thinkingId 
              ? { 
                  ...msg, 
                  content: `I can help you bridge various cryptocurrencies to MNT. Just tell me which currency and amount you'd like to bridge (e.g., "Bridge 0.1 ETH to MNT")`, 
                  status: 'complete' 
                } 
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === thinkingId 
            ? { 
                ...msg, 
                content: "I'm sorry, I encountered an error. Please try again.", 
                status: 'error' 
              } 
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Execute bridge process
  const executeBridge = async (currency, amount) => {
    setBridgeStatus('in_progress');
    
    // Add message about bridge start
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'ai',
        content: `I'm starting the bridge process for ${amount} ${currency} to MNT...`,
        timestamp: new Date()
      }
    ]);
    
    // Step 1: Approval
    await new Promise(resolve => setTimeout(resolve, 2000));
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'ai',
        content: <div className="flex items-center"><IconCheck size={16} className="text-green-500 mr-2" /> Approved {currency} for bridging</div>,
        timestamp: new Date()
      }
    ]);
    
    // Step 2: Initiate bridge
    await new Promise(resolve => setTimeout(resolve, 2500));
    const txHash = '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'ai',
        content: (
          <div>
            <div className="flex items-center"><IconCheck size={16} className="text-green-500 mr-2" /> Initiated bridge transaction</div>
            <div className="mt-1 text-xs text-gray-400">
              <a 
                href={`https://etherscan.io/tx/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                View on Etherscan: {txHash.substring(0, 10)}...
              </a>
            </div>
          </div>
        ),
        timestamp: new Date()
      }
    ]);
    
    // Step 3: Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 3000));
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'ai',
        content: <div className="flex items-center"><IconCheck size={16} className="text-green-500 mr-2" /> Confirmed on source chain</div>,
        timestamp: new Date()
      }
    ]);
    
    // Step 4: Process on Mantle
    await new Promise(resolve => setTimeout(resolve, 2000));
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'ai',
        content: <div className="flex items-center"><IconCheck size={16} className="text-green-500 mr-2" /> Processed on Mantle Network</div>,
        timestamp: new Date()
      }
    ]);
    
    // Step 5: Complete
    await new Promise(resolve => setTimeout(resolve, 1500));
    setBridgeStatus('completed');
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'ai',
        content: (
          <div>
            <p className="text-green-400 font-medium">🎉 Bridge completed successfully!</p>
            <p className="mt-2">Your {amount} MNT is now available in your wallet and ready to use with Money Button.</p>
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
              onClick={() => onComplete(amount)}
            >
              Continue to Money Button
            </button>
          </div>
        ),
        timestamp: new Date()
      }
    ]);
  };
  
  // Render message UI
  const renderMessage = (message) => {
    switch (message.type) {
      case 'user':
        return (
          <div className="flex items-start justify-end mb-4">
            <div className="bg-indigo-600/30 rounded-lg rounded-tr-none px-4 py-2 max-w-[80%]">
              <p className="text-white">{message.content}</p>
            </div>
            <div className="bg-indigo-600 w-8 h-8 rounded-full ml-2 flex items-center justify-center">
              <IconUser size={16} className="text-white" />
            </div>
          </div>
        );
        
      case 'ai':
        return (
          <div className="flex items-start mb-4">
            <div className="bg-purple-600 w-8 h-8 rounded-full mr-2 flex items-center justify-center">
              <IconRobot size={16} className="text-white" />
            </div>
            <div className="bg-gray-800 rounded-lg rounded-tl-none px-4 py-2 max-w-[80%]">
              {message.status === 'thinking' ? (
                <div className="flex items-center">
                  <IconLoader2 className="animate-spin mr-2 text-gray-400" size={16} />
                  <p className="text-gray-400">Thinking...</p>
                </div>
              ) : (
                <div className="text-white">{message.content}</div>
              )}
            </div>
          </div>
        );
        
      case 'system':
        return (
          <div className="text-xs text-center text-gray-500 mb-4">
            {message.content}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Main component render
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Chat interface */}
          <motion.div
            className="bg-gray-900 rounded-xl w-full max-w-lg h-[80vh] max-h-[600px] flex flex-col shadow-2xl relative overflow-hidden border border-indigo-500/30"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center">
                <IconRobot size={20} className="text-purple-500 mr-2" />
                <h2 className="text-lg font-semibold text-white">AI Wormhole Bridge</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {renderMessage(message)}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Bridge status indicator */}
            {bridgeStatus && (
              <div className={`px-4 py-2 ${bridgeStatus === 'completed' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                <div className="flex items-center">
                  {bridgeStatus === 'in_progress' ? (
                    <IconLoader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <IconCheck size={16} className="mr-2" />
                  )}
                  <span>
                    {bridgeStatus === 'in_progress' 
                      ? 'Bridge in progress...' 
                      : 'Bridge completed successfully!'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Input area */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isProcessing) {
                      handleMessage('');
                    }
                  }}
                  disabled={isProcessing || bridgeStatus === 'completed'}
                />
                <button
                  className={`ml-2 p-2 rounded-full ${isProcessing ? 'bg-gray-700' : 'bg-indigo-600'} ${bridgeStatus === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleMessage('')}
                  disabled={isProcessing || bridgeStatus === 'completed'}
                >
                  {isProcessing ? (
                    <IconLoader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <IconSend size={20} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 