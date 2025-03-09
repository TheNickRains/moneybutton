import { ReactNode } from 'react';
import { SourceChain, BridgeStatus, BridgeTransaction } from '../../services/universalBridgeService';

export type Role = 'user' | 'ai' | 'system';

// Message types for the chat interface
export interface ChatMessage {
  id: string;
  role: Role;
  content: string | ReactNode;
  timestamp: number;
}

// Props for ChatInterface component
export interface ChatInterfaceProps {
  messages: ChatMessage[];
  selectedChain: SourceChain | null;
  selectedToken: string | null;
  walletConnected: boolean;
  bridgeAmount: string;
  onChainSelect: (chain: SourceChain) => void;
  onTokenSelect: (token: string) => void;
  onConnectWallet: (chain: SourceChain) => Promise<void>;
  onAmountConfirm: () => void;
  onStartBridge: () => Promise<void>;
}

// Props for ChainSelector component
export interface ChainSelectorProps {
  onSelect: (chain: SourceChain) => void;
}

// Props for TokenSelector component
export interface TokenSelectorProps {
  chain: SourceChain;
  onSelect: (token: string) => void;
}

// Props for TransactionHistory component
export interface TransactionHistoryProps {
  isVisible: boolean;
  transactions: BridgeTransaction[];
}

// Props for message processing
export interface MessageProcessorProps {
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

// Props for wallet connection component
export interface WalletConnectionProps {
  chain: SourceChain;
  onConnect: () => Promise<void>;
  isConnected: boolean;
  walletAddress?: string;
  error?: string | null;
}

// Props for amount input component
export interface AmountInputProps {
  token: string;
  balance: string | null;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onMax: () => void;
} 