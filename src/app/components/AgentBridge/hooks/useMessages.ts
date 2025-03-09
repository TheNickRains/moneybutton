import { useState, useCallback, ReactNode } from 'react';
import { ChatMessage, Role } from '../types';

/**
 * Custom hook to manage chat messages
 * @returns methods and state for managing messages
 */
export function useMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  /**
   * Add a user message to the chat
   * @param content - Message content (string or ReactNode)
   */
  const addUserMessage = useCallback((content: string | ReactNode) => {
    const message: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, message]);
  }, []);

  /**
   * Add an AI message to the chat
   * @param content - Message content (string or ReactNode)
   */
  const addAIMessage = useCallback((content: string | ReactNode) => {
    const message: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, message]);
  }, []);

  /**
   * Add a system message to the chat
   * @param content - Message content (string or ReactNode)
   */
  const addSystemMessage = useCallback((content: string | ReactNode) => {
    const message: ChatMessage = {
      id: `system-${Date.now()}`,
      role: 'system',
      content,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, message]);
  }, []);

  /**
   * Get formatted chat history for context
   * @param limit - Number of messages to include (defaults to all)
   * @returns Formatted chat history string
   */
  const getFormattedChatHistory = useCallback((limit?: number) => {
    const historyMessages = limit ? messages.slice(-limit) : messages;
    
    return historyMessages.map(msg => {
      const role = msg.role === 'ai' ? 'Assistant' : msg.role === 'user' ? 'User' : 'System';
      const content = typeof msg.content === 'string' ? msg.content : 'Interactive Message';
      return `${role}: ${content}`;
    }).join('\n');
  }, [messages]);

  return {
    messages,
    addUserMessage,
    addAIMessage,
    addSystemMessage,
    getFormattedChatHistory
  };
} 