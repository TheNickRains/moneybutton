import { NextRequest, NextResponse } from 'next/server';
import { WormholeAgent } from '../../services/wormholeBridge';

export async function POST(req: NextRequest) {
  try {
    const { sourceChain, targetChain, tokenAddress, amount, recipientAddress } = await req.json();
    
    // Agent keys should be securely stored in environment variables
    const agent = new WormholeAgent(
      sourceChain, 
      targetChain,
      process.env.WORMHOLE_AGENT_SOURCE_KEY || '',
      process.env.WORMHOLE_AGENT_TARGET_KEY || ''
    );
    
    const txHash = await agent.bridgeTokens(tokenAddress, amount, recipientAddress);
    
    return NextResponse.json({ 
      success: true, 
      txHash,
      message: 'Bridge transaction completed'
    });
  } catch (error) {
    console.error('Bridge API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to bridge tokens'
      },
      { status: 500 }
    );
  }
} 