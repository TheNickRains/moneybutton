import { NextRequest, NextResponse } from 'next/server';
import { generateAIMessage, MessageType } from '../../services/aiService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageType, context } = body;
    
    const message = await generateAIMessage(
      messageType as MessageType, 
      context
    );
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error('AI message API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI message' },
      { status: 500 }
    );
  }
} 