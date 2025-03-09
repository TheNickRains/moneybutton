'use client';

import React, { useState } from 'react';

interface TokenIconProps {
  token: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * TokenIcon component for displaying cryptocurrency token logos with proper fallbacks
 */
export default function TokenIcon({ token, size = 'md', className = '' }: TokenIconProps) {
  const [error, setError] = useState(false);
  
  // Get icon path for the specified token
  const getTokenIconPath = (token: string): string => {
    return `/tokens/${token.toLowerCase()}.svg`;
  };
  
  // Handle image load error
  const handleError = () => {
    setError(true);
  };
  
  // Determine icon size based on the size prop
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  };
  
  const sizeClass = sizeClasses[size];
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={error ? '/tokens/default.svg' : getTokenIconPath(token)}
        alt={`${token} token`}
        className={`${sizeClass} ${error ? 'opacity-70' : ''}`}
        onError={handleError}
      />
    </div>
  );
} 