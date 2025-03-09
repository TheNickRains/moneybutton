'use client';

import React, { useState } from 'react';
import { SourceChain } from '../services/universalBridgeService';

interface ChainIconProps {
  chain: SourceChain;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ChainIcon component for displaying blockchain logos with proper fallbacks
 */
export default function ChainIcon({ chain, size = 'md', className = '' }: ChainIconProps) {
  const [error, setError] = useState(false);
  
  // Get icon path for the specified chain
  const getChainIconPath = (chain: SourceChain): string => {
    return `/chains/${chain}.svg`;
  };
  
  // Handle image load error
  const handleError = () => {
    setError(true);
  };
  
  // Determine icon size based on the size prop
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const sizeClass = sizeClasses[size];
  
  return (
    <div className={`flex items-center justify-center bg-gray-800 rounded-full ${sizeClass} ${className}`}>
      <img 
        src={error ? '/chains/default.svg' : getChainIconPath(chain)}
        alt={`${chain} logo`}
        className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-5 h-5' : 'w-8 h-8'}`}
        onError={handleError}
      />
    </div>
  );
} 