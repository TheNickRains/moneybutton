import React from 'react';
import { AmountInputProps } from '../types';
import TokenIcon from '../../TokenIcon';

/**
 * Component for entering the amount to bridge
 */
const AmountInput: React.FC<AmountInputProps> = ({
  token,
  balance,
  value,
  onChange,
  onConfirm,
  onMax
}) => {
  const isValidAmount = value && parseFloat(value) > 0 && 
    (!balance || parseFloat(value) <= parseFloat(balance));
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-lg">Enter Amount</h3>
        {balance && (
          <div className="text-sm text-gray-400">
            Balance: <span className="text-white">{balance} {token}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0.00"
            min="0"
            step="any"
            className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-24"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 flex items-center">
            <TokenIcon token={token} size="sm" className="mr-1.5" />
            <span>{token}</span>
          </div>
        </div>
        
        <button
          onClick={onMax}
          disabled={!balance}
          className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          MAX
        </button>
      </div>
      
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <span>Estimated Fee:</span>
        <span className="flex items-center">
          ~0.002 <TokenIcon token={token} size="sm" className="mx-1" /> {token}
        </span>
      </div>
      
      <button
        onClick={onConfirm}
        disabled={!isValidAmount}
        className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <span>Continue</span>
      </button>
    </div>
  );
};

export default AmountInput; 