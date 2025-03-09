import React from 'react';
import { TokenSelectorProps } from '../types';
import { universalBridgeService } from '../../../services/universalBridgeService';
import TokenIcon from '../../TokenIcon';

/**
 * Component for selecting a token to bridge
 */
const TokenSelector: React.FC<TokenSelectorProps> = ({ chain, onSelect }) => {
  const supportedTokens = universalBridgeService.getSupportedTokensForChain(chain);
  
  return (
    <div>
      <p className="mb-3">Select which token you want to bridge to Mantle Network:</p>
      <div className="grid grid-cols-2 gap-3">
        {supportedTokens.map(token => (
          <button
            key={token}
            className="flex items-center p-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
            onClick={() => onSelect(token)}
          >
            <TokenIcon token={token} size="md" className="mr-2" />
            <span className="text-sm font-medium">{token}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TokenSelector; 