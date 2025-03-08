import { NextRequest, NextResponse } from 'next/server';
import { AIWormholeAgent } from '../../services/aiWormholeAgent';

export async function POST(req: NextRequest) {
  const agent = new AIWormholeAgent();
  
  try {
    const body = await req.json();
    const { action, params } = body;
    
    let result;
    
    switch (action) {
      case 'determinePath':
        result = await agent.determineBridgingPath(
          params.sourceCurrency,
          params.amount
        );
        break;
        
      case 'executeBridge':
        result = await agent.executeBridge(
          params.sourceCurrency,
          params.amount,
          params.sourceChain,
          params.userAddress
        );
        break;
        
      case 'checkStatus':
        result = await agent.checkBridgeStatus(params.txHash);
        break;
        
      case 'distributeMNT':
        result = await agent.distributeMNT(
          params.userAddress,
          params.amount
        );
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ ...result, success: true });
  } catch (error) {
    console.error("AI Wormhole Agent API error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Unknown error occurred" 
      },
      { status: 500 }
    );
  }
} 