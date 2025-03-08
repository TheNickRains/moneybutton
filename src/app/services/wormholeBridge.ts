import { ethers } from 'ethers';
import {
  CONTRACTS,
  ChainId,
  TokenId,
  transferFromEth,
  parseSequenceFromLogEth,
  getEmitterAddressEth,
  attestFromEth,
  getSignedVAAWithRetry,
  createWrappedOnEth,
  redeemOnEth,
} from '@certusone/wormhole-sdk';

// Chain IDs for Wormhole
const CHAIN_ID_MAP = {
  'Ethereum': 2,
  'Mantle': 31, // Example, confirm actual value
  'Sepolia': 10002
};

// Wormhole contracts and token bridges
const WORMHOLE_CONTRACTS = {
  'Ethereum': {
    core: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
    tokenBridge: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585'
  },
  'Sepolia': {
    core: '0x4a8bc80Ed5a4067f1CCf107057b8270E0cB8aE6f',
    tokenBridge: '0xDB5492265f6038831E89f495670FF909aDe94bd9'
  },
  'Mantle': {
    core: '0xYOUR_WORMHOLE_CORE_ADDRESS',
    tokenBridge: '0xYOUR_TOKEN_BRIDGE_ADDRESS'
  }
};

// Agent class to handle bridging
export class WormholeAgent {
  private sourceProvider: ethers.providers.Provider;
  private targetProvider: ethers.providers.Provider;
  private sourceSigner: ethers.Signer;
  private targetSigner: ethers.Signer;
  private sourceChain: string;
  private targetChain: string;

  constructor(
    sourceChain: string, 
    targetChain: string, 
    sourcePrivateKey: string,
    targetPrivateKey: string
  ) {
    // Initialize providers
    this.sourceChain = sourceChain;
    this.targetChain = targetChain;
    this.sourceProvider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_WORMHOLE_RPC_URL || '');
    this.targetProvider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_WORMHOLE_RPC_URL || '');
    
    // Initialize signers
    this.sourceSigner = new ethers.Wallet(sourcePrivateKey, this.sourceProvider);
    this.targetSigner = new ethers.Wallet(targetPrivateKey, this.targetProvider);
  }

  // Bridge tokens from source to target chain
  async bridgeTokens(tokenAddress: string, amount: string, recipientAddress: string): Promise<string> {
    try {
      // Bridge parameters
      const sourceChainId = CHAIN_ID_MAP[this.sourceChain];
      const targetChainId = CHAIN_ID_MAP[this.targetChain];
      
      // Format amount for transfer
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function decimals() view returns (uint8)'],
        this.sourceProvider
      );
      const decimals = await tokenContract.decimals();
      const amountIn = ethers.utils.parseUnits(amount, decimals);
      
      // Approve token bridge to spend tokens
      const approvalTx = await this.approveTokens(tokenAddress, amountIn);
      await approvalTx.wait();
      
      // Transfer tokens via Wormhole
      const transferTx = await transferFromEth(
        WORMHOLE_CONTRACTS[this.sourceChain].tokenBridge,
        this.sourceSigner,
        tokenAddress,
        amountIn,
        targetChainId,
        recipientAddress,
        0, // no relayer fee
        ethers.constants.AddressZero // no relayer address
      );
      
      const transferReceipt = await transferTx.wait();
      
      // Get sequence from logs
      const sequence = parseSequenceFromLogEth(
        transferReceipt,
        WORMHOLE_CONTRACTS[this.sourceChain].core
      );
      
      // Get emitter address
      const emitterAddress = getEmitterAddressEth(WORMHOLE_CONTRACTS[this.sourceChain].tokenBridge);
      
      // Get signed VAA
      const { vaaBytes } = await getSignedVAAWithRetry(
        process.env.NEXT_PUBLIC_WORMHOLE_RPC_URL || '',
        sourceChainId,
        emitterAddress,
        sequence,
        {
          retryTimeout: 1000
        }
      );
      
      // Redeem on target chain
      const redeemTx = await redeemOnEth(
        WORMHOLE_CONTRACTS[this.targetChain].tokenBridge,
        this.targetSigner,
        vaaBytes
      );
      
      const redeemReceipt = await redeemTx.wait();
      
      return redeemReceipt.transactionHash;
    } catch (error) {
      console.error('Error bridging tokens:', error);
      throw error;
    }
  }
  
  // Helper to approve token spending
  private async approveTokens(tokenAddress: string, amount: ethers.BigNumber): Promise<ethers.ContractTransaction> {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function approve(address spender, uint256 amount) returns (bool)'
      ],
      this.sourceSigner
    );
    
    return tokenContract.approve(
      WORMHOLE_CONTRACTS[this.sourceChain].tokenBridge,
      amount
    );
  }
}

// API route handler for bridging
export async function bridgeTokensAPI(req, res) {
  try {
    const { sourceChain, targetChain, tokenAddress, amount, recipientAddress } = req.body;
    
    // Use environment variables for keys, never expose these
    const agent = new WormholeAgent(
      sourceChain, 
      targetChain,
      process.env.WORMHOLE_AGENT_SOURCE_KEY || '',
      process.env.WORMHOLE_AGENT_TARGET_KEY || ''
    );
    
    const txHash = await agent.bridgeTokens(tokenAddress, amount, recipientAddress);
    
    return res.status(200).json({ 
      success: true, 
      txHash,
      message: 'Bridge transaction completed'
    });
  } catch (error) {
    console.error('Bridge API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to bridge tokens'
    });
  }
} 