import React, { ReactNode } from 'react';
import { ChatMessage } from '../types';
import { processBridgeQuery } from '../../../services/bridgeAIService';
import { SourceChain, CHAIN_CONFIG } from '../../../services/universalBridgeService';
import { agentKitBridgeService } from '../../../services/agentKitBridgeService';

interface ProcessMessageParams {
  message: string;
  selectedChain: SourceChain | null;
  selectedToken: string | null;
  walletConnected: boolean;
  bridgeAmount: string;
  addAIMessage: (content: ReactNode) => void;
  addSystemMessage: (content: ReactNode) => void;
  getFormattedChatHistory: (limit?: number) => string;
  handleChainSelection: (chain: SourceChain) => void;
  handleTokenSelection: (token: string) => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  selectedChain: SourceChain | null;
  selectedToken: string | null;
  walletConnected: boolean;
  bridgeAmount: string;
  onChainSelect: (chain: SourceChain) => void;
  onTokenSelect: (token: string) => void;
  onConnectWallet: (chain: SourceChain) => Promise<string | null>;
  onAmountConfirm: () => void;
  onStartBridge: () => void;
}

/**
 * Component to render chat messages and process user input
 */
const ChatInterface: React.FC<ChatInterfaceProps> & { 
  processMessage: (params: ProcessMessageParams) => Promise<void> 
} = ({ 
  messages,
  selectedChain,
  selectedToken,
  walletConnected,
  bridgeAmount,
  onChainSelect,
  onTokenSelect,
  onConnectWallet,
  onAmountConfirm,
  onStartBridge
}) => {
  return (
    <div className="space-y-4">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : msg.role === 'system'
                ? 'bg-gray-700 text-gray-200 italic text-sm'
                : 'bg-gray-800 text-white'
            }`}
          >
            {typeof msg.content === 'string' ? <p>{msg.content}</p> : msg.content}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Process user messages with improved error handling and fallbacks
 */
ChatInterface.processMessage = async ({
  message,
  selectedChain,
  selectedToken,
  walletConnected,
  bridgeAmount,
  addAIMessage,
  addSystemMessage,
  getFormattedChatHistory,
  handleChainSelection,
  handleTokenSelection,
  setIsProcessing
}: ProcessMessageParams) => {
  try {
    // Show testnet status if using testnet
    const isTestnetEnabled = process.env.NEXT_PUBLIC_WORMHOLE_TESTNET_ENABLED === 'true';
    if (isTestnetEnabled && message.toLowerCase() === 'debug') {
      // Respond with debug information about the current testnet configuration
      addSystemMessage('📊 Testnet Debugging Information:');
      addSystemMessage(`🔹 Testnet Mode: Enabled`);
      addSystemMessage(`🔹 Selected Chain: ${selectedChain || 'None'}`);
      addSystemMessage(`🔹 Selected Token: ${selectedToken || 'None'}`);
      addSystemMessage(`🔹 Wallet Connected: ${walletConnected ? 'Yes' : 'No'}`);
      addSystemMessage(`🔹 Bridge Amount: ${bridgeAmount || '0'}`);
      
      // RPC information for the selected chain
      if (selectedChain) {
        const chainConfig = CHAIN_CONFIG[selectedChain];
        addSystemMessage(`🔹 Chain RPC URL: ${chainConfig.rpcUrl}`);
        addSystemMessage(`🔹 Chain ID: ${chainConfig.chainId}`);
        addSystemMessage(`🔹 Explorer: ${chainConfig.explorer}`);
      }
      
      setIsProcessing(false);
      return;
    }
    
    // Create context object to help the AI provide relevant responses
    const context = {
      selectedChain,
      selectedToken,
      walletConnected,
      bridgeAmount,
      chatHistory: getFormattedChatHistory(5), // Last 5 messages for context
      isTestnet: isTestnetEnabled // Add testnet flag to context
    };
    
    // First, attempt to process the message as a natural language bridge instruction
    // This approach is more robust and works without API access
    const bridgeInstruction = await agentKitBridgeService.processNaturalLanguageBridge(message);
    
    if (bridgeInstruction) {
      // If we successfully parsed a bridge instruction, process it
      addSystemMessage(`Detected bridge request with the following parameters:`);
      
      // Handle source chain selection if specified
      if (bridgeInstruction.sourceChain) {
        handleChainSelection(bridgeInstruction.sourceChain);
        addSystemMessage(`🌉 Source Chain: ${bridgeInstruction.sourceChain}`);
      }
      
      // Handle token selection if specified
      if (bridgeInstruction.token) {
        handleTokenSelection(bridgeInstruction.token);
        addSystemMessage(`💰 Token: ${bridgeInstruction.token}`);
      }
      
      // Handle amount specification if provided
      if (bridgeInstruction.amount) {
        // In a real implementation, we would update the bridge amount here
        addSystemMessage(`💵 Amount: ${bridgeInstruction.amount}`);
      }
      
      // Get bridge transaction estimates
      if (bridgeInstruction.sourceChain && bridgeInstruction.token && bridgeInstruction.amount) {
        try {
          const estimates = await agentKitBridgeService.estimateBridgeTransaction(bridgeInstruction);
          addSystemMessage(`⏱️ Estimated bridging time: ${Math.ceil(estimates.estimatedTime / 60)} minutes`);
          addSystemMessage(`💸 Fees: ${estimates.totalCost}`);
          
          // Generate step-by-step instructions
          const steps = agentKitBridgeService.generateBridgeSteps(bridgeInstruction);
          const stepsList = steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
          
          addAIMessage(`I'll help you bridge ${bridgeInstruction.amount} ${bridgeInstruction.token} from ${bridgeInstruction.sourceChain} to Mantle. Here's how to proceed:\n\n${stepsList}`);
        } catch (error) {
          console.error('Error estimating bridge transaction:', error);
          addAIMessage(`I understand you want to bridge ${bridgeInstruction.amount} ${bridgeInstruction.token} from ${bridgeInstruction.sourceChain} to Mantle. To proceed, please connect your wallet and follow the prompts.`);
        }
      } else {
        // We don't have complete information, but we've extracted some parts of the request
        addAIMessage(`I understand you want to bridge tokens to Mantle. To continue, I need to know:
        ${!bridgeInstruction.sourceChain ? '- Which blockchain are you bridging from?\n' : ''}
        ${!bridgeInstruction.token ? '- Which token do you want to bridge?\n' : ''}
        ${!bridgeInstruction.amount ? '- How much do you want to bridge?\n' : ''}`);
      }
    } else {
      // If it's not a bridge instruction, process as a regular query using bridgeAIService
      const response = await processBridgeQuery(message, context);
      
      // Add a testnet notice to the response if in testnet mode
      let finalResponse = response;
      if (isTestnetEnabled && !response.includes('TESTNET') && Math.random() < 0.3) {
        finalResponse = `${response}\n\n_Note: We're operating in testnet mode. All bridging operations use test tokens on testnets._`;
      }
      
      // Regular response
      addAIMessage(finalResponse);
    }
  } catch (error) {
    console.error('Error processing message with Bridge AI:', error);
    addAIMessage('I encountered an error processing your request. Please try again with a simpler question about bridging tokens to Mantle.');
  } finally {
    setIsProcessing(false);
  }
};

export default ChatInterface; 