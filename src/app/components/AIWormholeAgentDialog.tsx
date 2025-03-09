import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconLoader2, IconCircleCheck, IconAlertCircle, 
  IconArrowRight, IconExternalLink, IconRobot 
} from '@tabler/icons-react';
import { useMoneyButton } from '../providers';

interface AIWormholeAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (amount: string) => void;
  sourceCurrency: string;
  amount: string;
}

export default function AIWormholeAgentDialog({
  isOpen,
  onClose,
  onComplete,
  sourceCurrency,
  amount
}: AIWormholeAgentDialogProps) {
  const [step, setStep] = useState<'initial' | 'analyzing' | 'bridging' | 'completed' | 'failed'>('initial');
  const [bridgePath, setBridgePath] = useState<{
    route: string[];
    estimatedFees: string;
    estimatedTime: string;
    riskLevel: string;
  } | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState({
    status: 'pending',
    progress: 0,
    txHash: '',
    message: ''
  });
  const [userAddress, setUserAddress] = useState('');
  const [error, setError] = useState('');
  
  const { currentColorScheme } = useMoneyButton();
  
  // Get user's wallet address
  useEffect(() => {
    const getAddress = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setUserAddress(accounts[0]);
        } catch (error) {
          console.error("Error getting wallet address:", error);
          setError("Could not connect to wallet. Please connect your wallet first.");
        }
      } else {
        setError("No wallet detected. Please install MetaMask or another Web3 wallet.");
      }
    };
    
    if (isOpen) {
      getAddress();
    }
  }, [isOpen]);
  
  // Start analysis when dialog opens
  useEffect(() => {
    if (isOpen && userAddress && step === 'initial') {
      analyzeBridgePath();
    }
  }, [isOpen, userAddress, step]);
  
  // Analyze the optimal bridge path
  const analyzeBridgePath = async () => {
    setStep('analyzing');
    setError('');
    
    try {
      const response = await fetch('/api/ai-wormhole-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'determinePath',
          params: {
            sourceCurrency,
            amount
          }
        })
      });
      
      const data = await response.json();
      setBridgePath(data);
    } catch (error) {
      console.error("Error analyzing bridge path:", error);
      setError("Failed to determine the optimal bridging path. Please try again.");
      setStep('failed');
      return;
    }
  };
  
  // Start the bridge process
  const startBridge = async () => {
    setStep('bridging');
    setError('');
    
    try {
      // Get the source chain from the currency
      const sourceChain = sourceCurrency === 'MNT' ? 'Mantle' : 'Ethereum'; // This would be properly determined in real implementation
      
      const response = await fetch('/api/ai-wormhole-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'executeBridge',
          params: {
            sourceCurrency,
            amount,
            sourceChain,
            userAddress
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBridgeStatus({
          ...bridgeStatus,
          txHash: data.txHash,
          message: "Bridge transaction initiated. Monitoring progress..."
        });
        
        // Start monitoring the bridge status
        monitorBridgeStatus(data.txHash);
      } else {
        setError(data.error || "Failed to initiate bridge transaction");
        setStep('failed');
      }
    } catch (error) {
      console.error("Error starting bridge:", error);
      setError("Failed to initiate bridge transaction. Please try again.");
      setStep('failed');
    }
  };
  
  // Monitor the bridge status
  const monitorBridgeStatus = async (txHash: string) => {
    try {
      const checkStatus = async () => {
        const response = await fetch('/api/ai-wormhole-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'checkStatus',
            params: {
              txHash
            }
          })
        });
        
        const data = await response.json();
        
        setBridgeStatus({
          ...bridgeStatus,
          status: data.status,
          progress: data.progress,
          message: data.message || bridgeStatus.message
        });
        
        if (data.status === 'completed') {
          // Bridge completed, now distribute MNT to the user
          distributeMNT();
        } else if (data.status === 'failed') {
          setError("Bridge transaction failed. Please try again.");
          setStep('failed');
        } else {
          // Continue monitoring
          setTimeout(checkStatus, 5000);
        }
      };
      
      // Start the monitoring process
      checkStatus();
    } catch (error) {
      console.error("Error monitoring bridge status:", error);
      setError("Failed to monitor bridge status. Please check manually.");
      setStep('failed');
    }
  };
  
  // Distribute MNT to the user
  const distributeMNT = async () => {
    try {
      const response = await fetch('/api/ai-wormhole-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'distributeMNT',
          params: {
            userAddress,
            amount
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStep('completed');
        // Wait a moment before triggering completion callback
        setTimeout(() => {
          onComplete(amount);
        }, 2000);
      } else {
        setError(data.error || "Failed to distribute MNT");
        setStep('failed');
      }
    } catch (error) {
      console.error("Error distributing MNT:", error);
      setError("Failed to distribute MNT. Please contact support.");
      setStep('failed');
    }
  };
  
  // Restart the process
  const handleRetry = () => {
    setStep('initial');
    setBridgePath(null);
    setBridgeStatus({
      status: 'pending',
      progress: 0,
      txHash: '',
      message: ''
    });
    setError('');
  };
  
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
          
          {/* Dialog content */}
          <motion.div
            className="relative bg-[#191F2E] rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
            style={{ 
              border: `1px solid ${currentColorScheme.primary}30`,
              boxShadow: `0 0 20px 5px ${currentColorScheme.primary}20`
            }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center">
                <IconRobot 
                  size={24} 
                  className="mr-2"
                  style={{ color: currentColorScheme.primary }}
                />
                <span className="text-lg font-semibold">AI Wormhole Agent</span>
              </div>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={onClose}
              >
                Close
              </button>
            </div>
            
            {/* Body */}
            <div className="p-4">
              {step === 'initial' && (
                <div className="text-center">
                  <IconLoader2 className="animate-spin text-2xl mb-4" />
                  <p>{error || "Loading..."}</p>
                </div>
              )}
              {step === 'analyzing' && (
                <div className="text-center">
                  <IconLoader2 className="animate-spin text-2xl mb-4" />
                  <p>{error || "Analyzing the optimal bridging path..."}</p>
                </div>
              )}
              {step === 'bridging' && (
                <div className="text-center">
                  <IconLoader2 className="animate-spin text-2xl mb-4" />
                  <p>{error || "Starting the bridge process..."}</p>
                </div>
              )}
              {step === 'completed' && (
                <div className="text-center">
                  <IconCircleCheck className="text-green-500 text-2xl mb-4" />
                  <p>{bridgeStatus.message}</p>
                </div>
              )}
              {step === 'failed' && (
                <div className="text-center">
                  <IconAlertCircle className="text-red-500 text-2xl mb-4" />
                  <p>{error || "Bridge process failed. Please try again."}</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
              {step === 'initial' && (
                <button
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                  onClick={startBridge}
                >
                  Start Bridge
                </button>
              )}
              {step === 'completed' && (
                <button
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              )}
              {step === 'failed' && (
                <button
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 