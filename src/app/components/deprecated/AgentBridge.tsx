'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconSend, 
  IconRobot, 
  IconUser, 
  IconLoader2, 
  IconCheck, 
  IconX, 
  IconArrowRight, 
  IconCoin,
  IconWallet,
  IconHistory,
  IconArrowBackUp
} from '@tabler/icons-react';
import { universalBridgeService, SourceChain, BridgeStatus, BridgeTransaction, SUPPORTED_TOKENS } from '../../services/universalBridgeService';
import { 
  processQuery, 
  analyzeUserIntent, 
  getContextualResponse,
  generateQuickResponse,
  analyzeBridgeCommand
} from '../../services/langchainService';
import { aiWormholeAgentAPI } from '../../services/bridgeAgent';
import { initiateTokenBridge } from '../../services/wormholeService';

// Define message types for the chat interface
interface ChatMessage {
  id: string;
  type: string;
  content: string | ReactNode;
  timestamp: Date;
}

// Define props for the component
interface AgentBridgeProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { success: boolean; amount: string; token: string }) => void;
}

// Main AgentBridge component
export default function AgentBridge({ 
  isOpen, 
  onClose, 
  onComplete 
}: AgentBridgeProps) {
  // State variables
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedChain, setSelectedChain] = useState<SourceChain | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [bridgeAmount, setBridgeAmount] = useState<string>('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<BridgeTransaction | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<BridgeTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setMessages([
        {
          id: '1',
          type: 'system',
          content: 'Universal Bridge Assistant Initialized',
          timestamp: new Date()
        },
        {
          id: '2',
          type: 'ai',
          content: `Hello! I'm your Universal Bridge Assistant. I can help you convert tokens from any supported chain to MNT on the Mantle Network.`,
          timestamp: new Date()
        },
        {
          id: '3',
          type: 'ai',
          content: <div>
            <p>To get started, please select the source chain you'd like to bridge from:</p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.values(SourceChain).map(chain => (
                <button
                  key={chain}
                  className="flex flex-col items-center p-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                  onClick={() => handleChainSelection(chain)}
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full mb-2">
                    <img src={getChainLogo(chain)} alt={chain} className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">{getChainName(chain)}</span>
                </button>
              ))}
            </div>
          </div>,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen]);

  // Load transaction history on component mount
  useEffect(() => {
    if (isOpen) {
      const transactions = universalBridgeService.getTransactions();
      setTransactionHistory(transactions);
    }
  }, [isOpen]);
  
  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for wallet connection changes
  useEffect(() => {
    const isConnected = universalBridgeService.isWalletConnected();
    setWalletConnected(isConnected);
    if (isConnected) {
      setWalletAddress(universalBridgeService.getWalletAddress());
    }
  }, []);

  // Update token balance when token is selected
  useEffect(() => {
    const fetchBalance = async () => {
      if (walletConnected && selectedToken) {
        try {
          const balance = await universalBridgeService.getTokenBalance(selectedToken);
          setTokenBalance(balance);
        } catch (error) {
          console.error('Error fetching token balance:', error);
          setTokenBalance('0');
        }
      }
    };

    fetchBalance();
  }, [walletConnected, selectedToken]);

  // Get chain name for display
  const getChainName = (chain: SourceChain): string => {
    const chainNames: Record<SourceChain, string> = {
      [SourceChain.ETHEREUM]: 'Ethereum',
      [SourceChain.BINANCE]: 'BNB Chain',
      [SourceChain.POLYGON]: 'Polygon',
      [SourceChain.AVALANCHE]: 'Avalanche',
      [SourceChain.ARBITRUM]: 'Arbitrum',
      [SourceChain.OPTIMISM]: 'Optimism',
      [SourceChain.SOLANA]: 'Solana',
      [SourceChain.BASE]: 'Base',
      [SourceChain.MANTLE]: 'Mantle'
    };
    return chainNames[chain];
  };

  // Get chain logo URL
  const getChainLogo = (chain: SourceChain): string => {
    // In a real implementation, you would have actual logo URLs
    // For now, return a placeholder
    return `/chains/${chain}.svg`;
  };

  // Handle chain selection
  const handleChainSelection = (chain: SourceChain) => {
    setSelectedChain(chain);
    
    // Reset token and amount when chain changes
    setSelectedToken(null);
    setBridgeAmount('');
    setTokenBalance(null);
    
    // Add user message about chain selection
    addUserMessage(`I want to bridge from ${getChainName(chain)}`);
    
    // Check if wallet is connected, if not prompt to connect
    if (!walletConnected) {
      addAIMessage(
        <div>
          <p>Great choice! To bridge from {getChainName(chain)}, you'll need to connect your wallet first.</p>
          <button
            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            onClick={() => connectWallet(chain)}
          >
            <IconWallet size={18} className="mr-2" />
            Connect Wallet
          </button>
        </div>
      );
    } else {
      // If wallet is connected, show supported tokens
      showTokenSelection(chain);
    }
  };

  // Connect wallet
  const connectWallet = async (chain: SourceChain) => {
    setWalletError(null);
    
    try {
      const address = await aiWormholeAgentAPI.connectWallet(chain);
      if (address) {
        setWalletConnected(true);
        setWalletAddress(address);
        addSystemMessage(`Wallet connected: ${formatAddress(address)}`);
        
        // After successful connection, show token selection
        showTokenSelection(chain);
      } else {
        setWalletError('Failed to connect wallet. Please try again.');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setWalletError(error instanceof Error ? error.message : 'Unknown error connecting wallet');
    }
  };

  // Show token selection after chain is selected
  const showTokenSelection = (chain: SourceChain) => {
    const supportedTokens = universalBridgeService.getSupportedTokensForChain(chain);
    
    // Show token selection UI
    addAIMessage(
      <div>
        <p>Now, select which token you'd like to bridge to MNT:</p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {supportedTokens.map(token => {
            const tokenInfo = universalBridgeService.getTokenInfo(token);
            return (
              <button
                key={token}
                className="flex items-center p-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                onClick={() => handleTokenSelection(token)}
              >
                {tokenInfo?.logo && (
                  <img src={tokenInfo.logo} alt={token} className="w-6 h-6 mr-2" />
                )}
                <span className="text-sm font-medium">{token}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Handle token selection
  const handleTokenSelection = (token: string) => {
    setSelectedToken(token);
    addUserMessage(`I want to bridge ${token} to MNT`);
    
    // Show amount input
    addAIMessage(
      <div>
        <p>Great! How much {token} would you like to bridge to MNT?</p>
        <div className="mt-3">
          <div className="flex items-center">
            <input
              type="number"
              className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter amount"
              value={bridgeAmount}
              onChange={(e) => setBridgeAmount(e.target.value)}
              step="0.000001"
              min="0"
            />
            <button
              className="ml-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              onClick={() => handleMax()}
              disabled={!tokenBalance}
            >
              MAX
            </button>
          </div>
          {tokenBalance && (
            <div className="mt-2 text-sm text-gray-400">
              Available: {tokenBalance} {token}
            </div>
          )}
          <button
            className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
            onClick={() => handleAmountConfirmation()}
            disabled={!bridgeAmount || parseFloat(bridgeAmount) <= 0}
          >
            <IconArrowRight size={18} className="mr-2" />
            Continue
          </button>
        </div>
      </div>
    );
  };

  // Set max amount based on balance
  const handleMax = () => {
    if (tokenBalance) {
      setBridgeAmount(tokenBalance);
    }
  };

  // Handle amount confirmation
  const handleAmountConfirmation = () => {
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) return;
    
    addUserMessage(`I want to bridge ${bridgeAmount} ${selectedToken} to MNT`);
    
    // Show confirmation UI
    addAIMessage(
      <div>
        <p>Ready to bridge {bridgeAmount} {selectedToken} to MNT on Mantle Network.</p>
        <div className="mt-3 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-400">From</div>
            <div className="text-gray-400">To</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-700 rounded-full mr-2 flex items-center justify-center">
                <img 
                  src={selectedToken ? universalBridgeService.getTokenInfo(selectedToken)?.logo || '/tokens/default.svg' : '/tokens/default.svg'} 
                  alt={selectedToken || 'token'} 
                  className="w-5 h-5" 
                />
              </div>
              <div>
                <div className="font-medium">{bridgeAmount} {selectedToken}</div>
                <div className="text-sm text-gray-400">{getChainName(selectedChain!)}</div>
              </div>
            </div>
            <IconArrowRight className="text-gray-500" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-700 rounded-full mr-2 flex items-center justify-center">
                <img src="/tokens/mnt.svg" alt="MNT" className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium">{bridgeAmount} MNT</div>
                <div className="text-sm text-gray-400">Mantle Network</div>
              </div>
            </div>
          </div>
          <button
            className="mt-4 w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
            onClick={() => startBridgeProcess()}
          >
            <IconArrowRight size={18} className="mr-2" />
            Start Bridge Process
          </button>
        </div>
      </div>
    );
  };

  // Start the bridge process
  const startBridgeProcess = async () => {
    if (!selectedChain || !selectedToken || !bridgeAmount) {
      addSystemMessage('Please complete all required fields before bridging.');
      return;
    }
    
    try {
      // Use real LLM and bridging capabilities
      addSystemMessage('Initiating bridge process...');
      
      // Create a unique transaction ID
      const txId = Date.now().toString();
      
      // Create a transaction record
      const newTransaction: BridgeTransaction = {
        id: txId,
        sourceChain: selectedChain,
        sourceToken: selectedToken,
        destinationChain: SourceChain.MANTLE, // Use the enum value
        destinationToken: 'MNT',
        amount: bridgeAmount,
        status: BridgeStatus.PENDING,
        timestamp: new Date().getTime(),
        txHash: '',
        userAddress: walletAddress || 'Unknown'
      };
      
      // Add to transaction history
      setCurrentTransaction(newTransaction);
      setTransactionHistory(prev => [...prev, newTransaction]);
      
      // Update UI to show progress
      handleBridgeStatusChange(BridgeStatus.PENDING, txId);
      
      // Ensure wallet address is valid string
      const safeWalletAddress = walletAddress || '';
      
      // Use our new bridgeTokenToMantle function for real bridging
      const result = await aiWormholeAgentAPI.bridgeTokenToMantle(
        selectedChain,
        selectedToken,
        bridgeAmount,
        safeWalletAddress
      );
      
      if (result.success) {
        // Update transaction with hash
        const updatedTx = {
          ...newTransaction,
          status: BridgeStatus.COMPLETED,
          txHash: result.txHash
        };
        
        setCurrentTransaction(updatedTx);
        
        // Update transaction history
        setTransactionHistory(prev => 
          prev.map(tx => tx.id === txId ? updatedTx : tx)
        );
        
        // Update UI to show completion
        handleBridgeStatusChange(BridgeStatus.COMPLETED, txId);
        
        // Notify parent component of successful bridge
        onComplete({
          success: true,
          amount: bridgeAmount,
          token: selectedToken
        });
        
        addSystemMessage(
          <div>
            <p className="font-semibold text-green-400">Bridge completed successfully!</p>
            <p className="mt-1">
              {bridgeAmount} {selectedToken} has been transferred from {selectedChain} to Mantle.
            </p>
            <p className="mt-2 text-sm">
              Transaction Hash: <a 
                href={`${getChainExplorer(SourceChain.MANTLE)}/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {formatAddress(result.txHash)}
              </a>
            </p>
          </div>
        );
      } else {
        // Handle failure
        const updatedTx = {
          ...newTransaction,
          status: BridgeStatus.FAILED,
        };
        
        setCurrentTransaction(updatedTx);
        
        // Update transaction history
        setTransactionHistory(prev => 
          prev.map(tx => tx.id === txId ? updatedTx : tx)
        );
        
        // Update UI to show failure
        handleBridgeStatusChange(BridgeStatus.FAILED, txId);
        
        addSystemMessage(
          <div>
            <p className="font-semibold text-red-400">Bridge failed</p>
            <p className="mt-1">
              {result.error || 'Unknown error occurred during the bridging process.'}
            </p>
          </div>
        );
      }
    } catch (error) {
      console.error('Bridge process error:', error);
      addSystemMessage(
        <div>
          <p className="font-semibold text-red-400">Bridge failed</p>
          <p className="mt-1">
            {error instanceof Error ? error.message : 'Unknown error occurred during the bridging process.'}
          </p>
        </div>
      );
    }
  };

  // Handle bridge status changes
  const handleBridgeStatusChange = (status: BridgeStatus, txId: string) => {
    const transaction = universalBridgeService.getTransaction(txId);
    if (!transaction) return;
    
    setCurrentTransaction(transaction);
    
    switch (status) {
      case BridgeStatus.PENDING:
        addSystemMessage(`Bridge transaction initiated (ID: ${txId.slice(0, 8)})`);
        break;
      case BridgeStatus.CONFIRMING:
        addSystemMessage(`Confirming transaction on ${getChainName(transaction.sourceChain)}`);
        if (transaction.txHash) {
          addSystemMessage(
            <div className="flex items-center">
              <span>Transaction hash: </span>
              <a
                href={`${getChainExplorer(transaction.sourceChain)}/tx/${transaction.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-indigo-400 hover:text-indigo-300 underline"
              >
                {formatAddress(transaction.txHash)}
              </a>
            </div>
          );
        }
        break;
      case BridgeStatus.BRIDGING:
        addSystemMessage('Bridging assets to Mantle Network...');
        addAIMessage(
          <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-purple-500/30">
            <p className="text-center font-semibold mb-2">Bridge in Progress</p>
            <div className="flex justify-center space-x-3 text-xs text-gray-300">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mb-1"></div>
                <span>{getChainName(transaction.sourceChain)}</span>
              </div>
              <div className="flex items-center">
                <div className="h-0.5 w-10 bg-gradient-to-r from-green-500 to-purple-500"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-purple-500 animate-pulse mb-1"></div>
                <span>Bridge</span>
              </div>
              <div className="flex items-center">
                <div className="h-0.5 w-10 bg-gradient-to-r from-purple-500 to-blue-500"></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mb-1"></div>
                <span>Mantle</span>
              </div>
            </div>
            <p className="text-center text-xs mt-3 text-gray-300">Transferring {transaction.amount} {transaction.sourceToken} to Mantle Network</p>
            <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
              <div className="bg-purple-600 h-1.5 rounded-full animate-[bridgeProgress_5s_ease-in-out_forwards]"></div>
            </div>
          </div>
        );
        break;
      case BridgeStatus.COMPLETED:
        // Update transaction history
        const updatedHistory = universalBridgeService.getTransactions();
        setTransactionHistory(updatedHistory);
        
        addSystemMessage('Bridge completed successfully!');
        
        if (transaction.destinationTxHash) {
          addSystemMessage(
            <div className="flex items-center">
              <span>Mantle transaction: </span>
              <a
                href={`https://explorer.mantle.xyz/tx/${transaction.destinationTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-indigo-400 hover:text-indigo-300 underline"
              >
                {formatAddress(transaction.destinationTxHash)}
              </a>
            </div>
          );
        }
        
        addAIMessage(
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <IconCheck className="text-green-500" />
              <span className="font-semibold">Bridge Complete! Your tokens are now available as MNT.</span>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-300">Received</p>
                <p className="text-lg font-semibold">{transaction.amount} MNT</p>
              </div>
              <button 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                onClick={() => {
                  onComplete({ 
                    success: true, 
                    amount: transaction.amount,
                    token: 'MNT'
                  });
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
        break;
      case BridgeStatus.FAILED:
        addSystemMessage('Bridge transaction failed.');
        break;
    }
  };

  // Get chain explorer URL
  const getChainExplorer = (chain: SourceChain): string => {
    const explorers: Record<SourceChain, string> = {
      [SourceChain.ETHEREUM]: 'https://etherscan.io',
      [SourceChain.BINANCE]: 'https://bscscan.com',
      [SourceChain.POLYGON]: 'https://polygonscan.com',
      [SourceChain.AVALANCHE]: 'https://snowtrace.io',
      [SourceChain.ARBITRUM]: 'https://arbiscan.io',
      [SourceChain.OPTIMISM]: 'https://optimistic.etherscan.io',
      [SourceChain.SOLANA]: 'https://explorer.solana.com',
      [SourceChain.BASE]: 'https://basescan.org',
      [SourceChain.MANTLE]: 'https://explorer.mantle.xyz'
    };
    return explorers[chain];
  };

  // Format address for display
  const formatAddress = (address: string | undefined): string => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Toggle transaction history display
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  // Add user message helper
  const addUserMessage = (content: string | ReactNode) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'user',
        content,
        timestamp: new Date()
      }
    ]);
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
  const addSystemMessage = (content: string | ReactNode) => {
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

  // Handle text input submission
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    // Add user message
    addUserMessage(input);
    
    // Process user message
    processUserMessage(input);
    
    // Clear input
    setInput('');
  };

  // Format chat history for LLM context
  const getFormattedChatHistory = (messageCount: number = 5) => {
    // Get only user and AI messages (not system messages)
    const relevantMessages = messages
      .filter(msg => msg.type === 'user' || msg.type === 'ai')
      .slice(-messageCount); // Get only the last N messages
    
    // Format messages into a string that the LLM can understand
    return relevantMessages.map(msg => {
      // Convert ReactNode content to string if needed
      const contentStr = typeof msg.content === 'string' 
        ? msg.content 
        : 'Interactive content'; // Simplified placeholder for ReactNode content
      
      return `${msg.type === 'user' ? 'Human' : 'AI'}: ${contentStr}`;
    }).join('\n');
  };

  const processUserMessage = async (message: string) => {
    setIsProcessing(true);
    
    try {
      // Log the incoming message
      console.log('Processing user message:', message);
      
      // Show a typing indicator
      const typingIndicatorId = `typing-${Date.now()}`;
      addAIMessage(
        <div id={typingIndicatorId} className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          <span className="text-sm text-gray-400">Thinking...</span>
        </div>
      );
      
      // Create a rich context object for the LLM
      const context = {
        selectedChain: selectedChain,
        selectedToken: selectedToken,
        walletConnected: walletConnected,
        bridgeAmount: bridgeAmount,
        supportedChains: Object.values(SourceChain),
        currentStep: selectedChain 
          ? (walletConnected 
              ? (selectedToken 
                  ? (bridgeAmount ? 'ready_to_bridge' : 'input_amount') 
                  : 'select_token')
              : 'connect_wallet') 
          : 'select_chain',
        chatHistory: getFormattedChatHistory(5) // Get the last 5 messages for context
      };
      
      // Try to use the LLM service via LangChain
      console.log('Generating response with context:', context);
      
      try {
        // First analyze the intent to detect commands vs. questions
        const intentAnalysis = await analyzeUserIntent(message);
        console.log('Intent analysis:', intentAnalysis);
        
        // Handle wallet connection requests specially (they need UI interaction)
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('wallet is connected') || 
            lowerMessage.includes('connected my wallet') ||
            lowerMessage.includes('wallet connected') ||
            lowerMessage.includes('i have connected')) {
          
          // Handle wallet connection flow
          // Remove typing indicator
          setMessages(prev => prev.filter(m => m.id !== typingIndicatorId));
          
          // Check if a chain has been selected
          if (selectedChain) {
            // Connection logic remains unchanged
            try {
              const address = await aiWormholeAgentAPI.connectWallet(selectedChain);
              if (address) {
                setWalletConnected(true);
                setWalletAddress(address);
                
                addAIMessage(
                  <div>
                    <p>Great! I've detected your wallet connection. Your wallet address is {formatAddress(address)}.</p>
                    <p>Now let's select which token you want to bridge from {getChainName(selectedChain)} to Mantle.</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {universalBridgeService.getSupportedTokensForChain(selectedChain).map(token => (
                        <button
                          key={token}
                          className="flex items-center p-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                          onClick={() => handleTokenSelection(token)}
                        >
                          <img
                            src={`/tokens/${token.toLowerCase()}.svg`}
                            alt={token}
                            className="w-6 h-6 mr-2"
                            onError={(e) => (e.target as HTMLImageElement).src = '/tokens/default.svg'}
                          />
                          <span>{token}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              } else {
                // Connection failed UI
                addAIMessage(
                  <div>
                    <p>I couldn't detect your wallet connection. Please try connecting again using the button below.</p>
                    <button
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center"
                      onClick={() => connectWallet(selectedChain)}
                    >
                      <IconWallet className="mr-2" size={18} />
                      Connect Wallet
                    </button>
                  </div>
                );
              }
            } catch (error) {
              console.error('Error connecting wallet:', error);
              addAIMessage(
                <div>
                  <p>I encountered an error trying to connect to your wallet. Please make sure you have a wallet extension installed and try again.</p>
                  <button
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center"
                    onClick={() => connectWallet(selectedChain)}
                  >
                    <IconWallet className="mr-2" size={18} />
                    Connect Wallet
                  </button>
                </div>
              );
            }
          } else {
            // If no chain selected, prompt for chain selection
            addAIMessage(
              <div>
                <p>Before connecting your wallet, please select which blockchain you want to bridge from:</p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.values(SourceChain).map(chain => (
                    <button
                      key={chain}
                      className="flex flex-col items-center p-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                      onClick={() => handleChainSelection(chain)}
                    >
                      <img 
                        src={`/chains/${chain}.svg`} 
                        alt={chain} 
                        className="w-8 h-8 mb-2"
                        onError={(e) => (e.target as HTMLImageElement).src = '/chains/default.svg'}
                      />
                      <span className="text-sm capitalize">{chain}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          return;
        }
        
        // For all other requests, use the LLM
        // Generate a response using the LLM via LangChain
        const response = await processQuery(message, 'bridge_assistant', context);
        console.log('LLM response:', response);
        
        // Remove the typing indicator
        setMessages(prev => prev.filter(m => m.id !== typingIndicatorId));
        
        // Add the AI response
        addAIMessage(
          <div className="whitespace-pre-wrap">
            {response}
          </div>
        );
        
        // Check if we need to take any actions based on the intent
        if (intentAnalysis.intent === 'start_bridge' && intentAnalysis.confidence > 0.7) {
          // Extract parameters from the message
          const bridgeParams = await analyzeBridgeCommand(message);
          
          // If we detected a source chain, select it
          if (bridgeParams.sourceChain && Object.values(SourceChain).includes(bridgeParams.sourceChain as SourceChain)) {
            setTimeout(() => {
              handleChainSelection(bridgeParams.sourceChain as SourceChain);
            }, 1000);
          }
          
          // If we detected a token and it's valid for the selected chain, select it
          if (bridgeParams.token && selectedChain) {
            const supportedTokens = universalBridgeService.getSupportedTokensForChain(selectedChain);
            const matchedToken = supportedTokens.find(t => 
              t.toLowerCase() === bridgeParams.token?.toLowerCase()
            );
            
            if (matchedToken) {
              setTimeout(() => {
                handleTokenSelection(matchedToken);
              }, 2000);
            }
          }
          
          // If we detected an amount and we have a token selected, set it
          if (bridgeParams.amount && !isNaN(Number(bridgeParams.amount)) && selectedToken) {
            setTimeout(() => {
              setBridgeAmount(bridgeParams.amount as string);
              handleAmountConfirmation();
            }, 3000);
          }
        }
      } catch (llmError) {
        console.error('Error using LLM:', llmError);
        
        // Remove typing indicator
        setMessages(prev => prev.filter(m => m.id !== typingIndicatorId));
        
        // Use our fallback pattern-matching approach for basic questions if LLM fails
        const lowerMessage = message.toLowerCase();
        
        // Basic questions about bridging
        if (lowerMessage.includes('what is bridging') || 
            lowerMessage.includes('what does bridging mean') ||
            lowerMessage.includes('how does bridging work')) {
          addAIMessage(getBridgeInfo());
          return;
        }
        
        // Questions about specific chains
        for (const chain of Object.values(SourceChain)) {
          if (lowerMessage.includes(chain.toLowerCase()) && 
              (lowerMessage.includes('what is') || 
               lowerMessage.includes('tell me about') || 
               lowerMessage.includes('explain'))) {
            addAIMessage(getChainInfo(chain));
            return;
          }
        }
        
        // Questions about fees
        if (lowerMessage.includes('fee') || 
            lowerMessage.includes('cost') || 
            lowerMessage.includes('gas')) {
          addAIMessage(getFeeInfo());
          return;
        }
        
        // Questions about time
        if (lowerMessage.includes('how long') || 
            lowerMessage.includes('time') || 
            lowerMessage.includes('duration')) {
          addAIMessage(getTimeInfo());
          return;
        }
        
        // Questions about security
        if (lowerMessage.includes('security') || 
            lowerMessage.includes('safe') || 
            lowerMessage.includes('risk')) {
          addAIMessage(getSecurityInfo());
          return;
        }
        
        // Questions about Mantle
        if (lowerMessage.includes('mantle') || 
            lowerMessage.includes('mnt')) {
          addAIMessage(getMantleInfo());
          return;
        }
        
        // Fallback response if no patterns match
        addAIMessage(
          <div>
            <p>I can help you bridge tokens from various chains to Mantle Network. Would you like to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Select a source chain to bridge from</li>
              <li>Learn more about the bridging process</li>
              <li>Get information about supported tokens</li>
            </ul>
            <p className="mt-2">Just let me know what you'd like to do, and I'll guide you through the process.</p>
          </div>
        );
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Get detailed error information for debugging
      const errorDetails = error instanceof Error 
        ? `${error.name}: ${error.message}\nStack: ${error.stack}` 
        : 'Unknown error type';
      
      console.error('Detailed error info:', errorDetails);
      
      // Show user-friendly error message with minimal error details
      addAIMessage(
        <div>
          <p>I apologize, but I encountered an error while processing your message. Please try asking a simpler question or try again later.</p>
          <p className="text-xs text-gray-500 mt-2">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Get detailed information about a specific chain
  const getChainInfo = (chain: SourceChain): ReactNode => {
    const chainInfo: Record<SourceChain, ReactNode> = {
      [SourceChain.ETHEREUM]: (
        <div>
          <p><strong>Ethereum</strong> is the original smart contract platform launched in 2015. It uses its native token ETH for transactions and smart contract execution.</p>
          <p className="mt-2">Key features:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Largest and most established smart contract platform</li>
            <li>Extensive developer community and ecosystem</li>
            <li>High security through decentralization</li>
            <li>Recently transitioned to Proof of Stake consensus</li>
          </ul>
          <p className="mt-2">Bridging from Ethereum to Mantle offers lower transaction fees and faster confirmation times while maintaining EVM compatibility.</p>
        </div>
      ),
      [SourceChain.BINANCE]: (
        <div>
          <p><strong>BNB Chain</strong> (formerly Binance Smart Chain) is a blockchain network built for running smart contract-based applications with lower fees and faster transaction times than Ethereum.</p>
          <p className="mt-2">Key features:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Compatible with Ethereum tools and dApps</li>
            <li>Lower gas fees compared to Ethereum</li>
            <li>Faster block times (3 seconds)</li>
            <li>Operated by Binance, the largest cryptocurrency exchange</li>
          </ul>
          <p className="mt-2">Bridging from BNB Chain to Mantle can provide even better scalability and integration with the Mantle ecosystem.</p>
        </div>
      ),
      [SourceChain.POLYGON]: (
        <div>
          <p><strong>Polygon</strong> is a Layer-2 scaling solution for Ethereum that provides faster transactions and lower fees through its proof-of-stake sidechain.</p>
          <p className="mt-2">Key features:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Ethereum compatibility with improved performance</li>
            <li>Mature ecosystem with many dApps and services</li>
            <li>Fast transaction confirmation times</li>
            <li>Well-established bridges to other networks</li>
          </ul>
          <p className="mt-2">Bridging from Polygon to Mantle allows you to explore new opportunities in the growing Mantle ecosystem.</p>
        </div>
      ),
      [SourceChain.AVALANCHE]: (
        <div>
          <p><strong>Avalanche</strong> is a high-performance blockchain platform that emphasizes security, speed, and eco-friendliness through its unique consensus mechanism.</p>
          <p className="mt-2">Key features:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Sub-second finality for transaction confirmation</li>
            <li>Support for custom blockchains (subnets)</li>
            <li>EVM compatibility for easy development</li>
            <li>High throughput design</li>
          </ul>
          <p className="mt-2">Bridging from Avalanche to Mantle gives you access to Mantle's growing DeFi ecosystem while maintaining high performance.</p>
        </div>
      ),
      [SourceChain.ARBITRUM]: (
        <div>
          <p><strong>Arbitrum</strong> is a Layer-2 scaling solution for Ethereum that uses optimistic rollups to achieve higher throughput and lower fees.</p>
          <p className="mt-2">Key features:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Full Ethereum smart contract compatibility</li>
            <li>Significantly lower gas fees than Ethereum mainnet</li>
            <li>Inherits Ethereum's security guarantees</li>
            <li>Growing ecosystem of dApps and services</li>
          </ul>
          <p className="mt-2">Bridging from Arbitrum to Mantle lets you explore another optimized Layer-2 solution with unique benefits.</p>
        </div>
      ),
      [SourceChain.OPTIMISM]: (
        <div>
          <p><strong>Optimism</strong> is an Ethereum Layer-2 scaling solution that uses optimistic rollups to improve transaction throughput and reduce fees.</p>
          <p className="mt-2">Key features:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>EVM equivalent for seamless development experience</li>
            <li>Lower transaction costs than Ethereum mainnet</li>
            <li>Faster transaction processing</li>
            <li>Strong focus on governance and public goods funding</li>
          </ul>
          <p className="mt-2">Bridging from Optimism to Mantle allows you to experience another OP Stack-based L2 with its own ecosystem.</p>
        </div>
      ),
      [SourceChain.SOLANA]: (
        <div>
          <p><strong>Solana</strong> is a high-performance blockchain that achieves high throughput through its unique proof-of-history consensus mechanism.</p>
          <p className="mt-2">Key features:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Extremely high transaction throughput (thousands of TPS)</li>
            <li>Very low transaction fees</li>
            <li>Sub-second finality</li>
            <li>Different programming model from EVM chains (Rust-based)</li>
          </ul>
          <p className="mt-2">Bridging from Solana to Mantle allows you to move assets from a non-EVM chain to an EVM-compatible environment.</p>
        </div>
      ),
      [SourceChain.BASE]: (
        <div>
          <p><strong>Base</strong> is an Ethereum Layer-2 scaling solution built by Coinbase using the OP Stack from Optimism.</p>
          <p className="mt-2">Key features:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Full EVM compatibility</li>
            <li>Backed by Coinbase for institutional adoption</li>
            <li>Lower fees and faster transactions than Ethereum mainnet</li>
            <li>Growing ecosystem of applications</li>
          </ul>
          <p className="mt-2">Bridging from Base to Mantle gives you access to another L2 with promising growth and development.</p>
        </div>
      ),
      [SourceChain.MANTLE]: (
        <div>
          <p><strong>Mantle</strong> is an Ethereum Layer-2 scaling solution that uses optimistic rollups and the OP Stack for enhanced scalability.</p>
          <p className="mt-2">Key features:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Full Ethereum compatibility</li>
            <li>Low transaction fees and fast confirmations</li>
            <li>Native MNT token for gas and governance</li>
            <li>Growing ecosystem of DeFi and gaming applications</li>
          </ul>
          <p className="mt-2">Mantle is your destination chain for this bridge, where you can use various applications with improved performance.</p>
        </div>
      )
    };
    return chainInfo[chain];
  };

  // Get general bridge information
  const getBridgeInfo = (): ReactNode => {
    return (
      <div>
        <p><strong>Blockchain bridges</strong> allow you to transfer assets between different blockchain networks.</p>
        <p className="mt-2">Our universal bridge uses secure protocols to connect multiple chains to Mantle Network:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-300">
          <li><strong>Security:</strong> The bridge uses trusted protocols with proper security audits</li>
          <li><strong>Speed:</strong> Most bridges complete within 5-15 minutes depending on network conditions</li>
          <li><strong>Fees:</strong> Bridge fees vary by source chain but are typically $1-20</li>
          <li><strong>Supported chains:</strong> Ethereum, Polygon, BNB Chain, Avalanche, Arbitrum, Optimism, Solana, Base</li>
          <li><strong>Supported tokens:</strong> ETH, BTC (wrapped), USDC, USDT and more</li>
        </ul>
        <p className="mt-3">When you bridge to Mantle Network, your original tokens are locked in a smart contract on the source chain, and equivalent MNT tokens are minted on Mantle.</p>
      </div>
    );
  };

  // Get fee information
  const getFeeInfo = (): ReactNode => {
    return (
      <div>
        <p><strong>Bridge fees</strong> consist of two components:</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm text-gray-300">
          <li><strong>Source chain gas fees:</strong> Paid in the source chain's native token to initiate the bridge</li>
          <li><strong>Bridge protocol fees:</strong> A small percentage or fixed fee charged by the bridge protocol</li>
        </ol>
        <p className="mt-2">Typical fee ranges by source chain:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-300">
          <li>Ethereum: $5-20 (higher during network congestion)</li>
          <li>Polygon, Avalanche, BNB Chain: $0.50-3</li>
          <li>Arbitrum, Optimism, Base: $0.20-2</li>
          <li>Solana: $0.01-0.10</li>
        </ul>
        <p className="mt-3">The exact fee will be shown before you confirm the bridge transaction. Larger amounts don't necessarily mean higher fees, as fees are generally based on computational complexity, not value transferred.</p>
      </div>
    );
  };

  // Get time information
  const getTimeInfo = (): ReactNode => {
    return (
      <div>
        <p><strong>Bridge completion times</strong> vary by source chain and network conditions:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-300">
          <li>Ethereum: 5-15 minutes (depends on gas price and network congestion)</li>
          <li>Polygon, Avalanche, BNB Chain: 3-10 minutes</li>
          <li>Arbitrum, Optimism, Base: 2-10 minutes</li>
          <li>Solana: 2-5 minutes</li>
        </ul>
        <p className="mt-3">The bridging process involves:</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm text-gray-300">
          <li>Confirmation on the source chain (varies by chain)</li>
          <li>Verification by bridge validators/relayers (1-5 minutes)</li>
          <li>Finalization on Mantle Network (typically under 1 minute)</li>
        </ol>
        <p className="mt-3">Our interface provides real-time status updates throughout the process.</p>
      </div>
    );
  };

  // Get security information
  const getSecurityInfo = (): ReactNode => {
    return (
      <div>
        <p><strong>Bridge security</strong> is a top priority in our universal bridge:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-300">
          <li><strong>Audited contracts:</strong> All bridge smart contracts undergo rigorous security audits</li>
          <li><strong>Verified relayers:</strong> Transactions are verified by a network of trusted validators</li>
          <li><strong>Transaction monitoring:</strong> Real-time tracking of bridge status and confirmation</li>
          <li><strong>History tracking:</strong> All bridge transactions are recorded for future reference</li>
        </ul>
        <p className="mt-3">To maximize security:</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm text-gray-300">
          <li>Start with smaller test transactions if you're new to bridging</li>
          <li>Verify wallet addresses carefully before confirming</li>
          <li>Wait for full confirmation before considering a bridge complete</li>
        </ol>
        <p className="mt-3">Our bridge has successfully processed thousands of transactions with a reliable security track record.</p>
      </div>
    );
  };

  // Get Mantle Network information
  const getMantleInfo = (): ReactNode => {
    return (
      <div>
        <p><strong>Mantle Network</strong> is a Layer 2 scaling solution for Ethereum that offers:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-300">
          <li><strong>High throughput:</strong> Up to 1000+ transactions per second</li>
          <li><strong>Low fees:</strong> Typically 10-100x lower than Ethereum mainnet</li>
          <li><strong>EVM compatibility:</strong> Works with existing Ethereum tools and dApps</li>
          <li><strong>Security:</strong> Inherits security from Ethereum while adding scalability</li>
        </ul>
        <p className="mt-3"><strong>MNT token</strong> is the native token of Mantle Network used for:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-300">
          <li>Paying transaction fees (gas)</li>
          <li>Staking and securing the network</li>
          <li>Participating in governance</li>
          <li>Accessing Mantle Network applications like Money Button</li>
        </ul>
        <p className="mt-3">Our bridge makes it easy to convert other tokens to MNT so you can fully participate in the Mantle ecosystem.</p>
      </div>
    );
  };

  // Handle dialog close
  const handleClose = () => {
    // If there's a completed transaction, pass it to the callback
    if (currentTransaction && currentTransaction.status === BridgeStatus.COMPLETED) {
      onComplete({ 
        success: true, 
        amount: currentTransaction.amount,
        token: 'MNT'
      });
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

  // Render transaction history
  const renderTransactionHistory = () => {
    if (transactionHistory.length === 0) {
      return (
        <div className="text-center text-gray-400 py-4">
          No transaction history found
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {transactionHistory.slice(0, 5).map((tx) => (
          <div key={tx.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <span className="text-sm font-medium">{tx.amount} {tx.sourceToken} → MNT</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getBadgeColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  From: {getChainName(tx.sourceChain)} · {new Date(tx.timestamp).toLocaleString()}
                </div>
              </div>
              {tx.status === BridgeStatus.COMPLETED && (
                <button 
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded"
                  onClick={() => {
                    onComplete({ 
                      success: true, 
                      amount: tx.amount,
                      token: 'MNT'
                    });
                    onClose();
                  }}
                >
                  Use MNT
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Get badge color based on transaction status
  const getBadgeColor = (status: BridgeStatus): string => {
    switch (status) {
      case BridgeStatus.PENDING:
        return 'bg-yellow-800 text-yellow-200';
      case BridgeStatus.CONFIRMING:
        return 'bg-blue-800 text-blue-200';
      case BridgeStatus.BRIDGING:
        return 'bg-purple-800 text-purple-200';
      case BridgeStatus.COMPLETED:
        return 'bg-green-800 text-green-200';
      case BridgeStatus.FAILED:
        return 'bg-red-800 text-red-200';
      default:
        return 'bg-gray-800 text-gray-200';
    }
  };
  
  // Main render
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
            className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg mx-4 overflow-hidden shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-gray-800 p-4 bg-gradient-to-r from-[#2438E8]/10 to-[#7B4DFF]/10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Universal Bridge to MNT</h3>
                <div className="flex items-center">
                  <button
                    className="text-gray-400 hover:text-white mr-3"
                    onClick={toggleHistory}
                  >
                    <IconHistory size={20} />
                  </button>
                  <button 
                    className="text-gray-400 hover:text-white"
                    onClick={handleClose}
                  >
                    <IconX size={20} />
                  </button>
                </div>
              </div>
              {walletConnected && (
                <div className="mt-2 flex items-center text-sm text-gray-400">
                  <IconWallet size={14} className="mr-1" />
                  <span>{formatAddress(walletAddress)}</span>
                  <button 
                    className="ml-2 text-indigo-400 hover:text-indigo-300 text-xs"
                    onClick={() => {
                      universalBridgeService.disconnectWallet();
                      setWalletConnected(false);
                      setWalletAddress('');
                      addSystemMessage('Wallet disconnected');
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
            
            {/* Main content - either chat or history */}
            {showHistory ? (
              <div className="p-4 h-96 overflow-y-auto bg-gradient-to-b from-transparent to-[#07081A]/50">
                <div className="flex items-center mb-4">
                  <button
                    className="flex items-center text-sm text-indigo-400 hover:text-indigo-300"
                    onClick={toggleHistory}
                  >
                    <IconArrowBackUp size={16} className="mr-1" />
                    Back to Chat
                  </button>
                  <h4 className="text-lg font-medium ml-4">Transaction History</h4>
                </div>
                {renderTransactionHistory()}
              </div>
            ) : (
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
            )}
            
            {/* Input area - only show in chat mode */}
            {!showHistory && (
              <form onSubmit={handleInputSubmit} className="border-t border-gray-800 p-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="Ask me about bridging tokens..."
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
                  <span>Powered by Multiple Bridges</span> | <span>Destination: Mantle Network</span>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 