import { NextRequest, NextResponse } from 'next/server';
import { universalBridgeService, SourceChain, BridgeStatus } from '../../services/universalBridgeService';

interface BridgeRequestBody {
  sourceChain: string;
  tokenSymbol: string;
  amount: string;
  recipientAddress: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: BridgeRequestBody = await req.json();
    const { sourceChain, tokenSymbol, amount, recipientAddress } = body;
    
    // Validate input parameters
    if (!sourceChain || !tokenSymbol || !amount || !recipientAddress) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required parameters'
        },
        { status: 400 }
      );
    }
    
    // Connect wallet if needed (in a real implementation, this would use the user's wallet)
    if (!universalBridgeService.isWalletConnected()) {
      await universalBridgeService.connectWallet(sourceChain as SourceChain);
    }
    
    // Initialize bridge process
    const transaction = await universalBridgeService.bridgeTokens(
      sourceChain as SourceChain,
      tokenSymbol,
      amount,
      (status: BridgeStatus, id: string) => {
        // This callback will be called as the bridge status changes
        console.log(`Bridge status updated: ${status} for transaction ${id}`);
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      txHash: transaction.txHash || '',
      txId: transaction.id,
      message: 'Bridge transaction initiated',
      status: transaction.status
    });
  } catch (error) {
    console.error('Bridge API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to bridge tokens';
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
} 