import { NextRequest, NextResponse } from 'next/server';
import { getAllPrices } from '../../services/priceFeeds';

export async function GET(req: NextRequest) {
  try {
    const prices = await getAllPrices();
    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Price API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
} 