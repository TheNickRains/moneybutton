import React from 'react';
import { ChainSelectorProps } from '../types';
import { SourceChain } from '../../../services/universalBridgeService';
import ChainIcon from '../../ChainIcon';

/**
 * Component to render a grid of blockchain options for selection
 */
const ChainSelector: React.FC<ChainSelectorProps> = ({ onSelect }) => {
  /**
   * Get the chain display name
   * @param chain - Source chain enum value
   * @returns Formatted chain name for display
   */
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

  /**
   * Get chain logo URL
   * @param chain - Source chain enum value
   * @returns Path to chain logo image
   */
  const getChainLogo = (chain: SourceChain): string => {
    return `/chains/${chain}.svg`;
  };
  
  // Exclude Mantle from source chain options since it's the destination
  const sourceChains = Object.values(SourceChain).filter(chain => chain !== SourceChain.MANTLE);
  
  return (
    <div>
      <p>To get started, please select the source chain you'd like to bridge from:</p>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {sourceChains.map(chain => (
          <button
            key={chain}
            className="flex flex-col items-center p-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
            onClick={() => onSelect(chain)}
          >
            <ChainIcon chain={chain} size="md" className="mb-2" />
            <span className="text-sm font-medium text-gray-200">
              {getChainName(chain)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChainSelector; 