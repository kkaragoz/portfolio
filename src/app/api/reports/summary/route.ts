import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.$queryRaw<Array<{ portfolio_cost: number; portfolio_value: number }>>`
      SELECT 
        COALESCE(SUM(total_cost), 0)::float as portfolio_cost,
        COALESCE(SUM(market_value), 0)::float as portfolio_value
      FROM rep_grid
    `;

    const result = data[0] || { portfolio_cost: 0, portfolio_value: 0 };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('rep_grid summary error:', error);
    return NextResponse.json({ error: 'Veri alınamadı' }, { status: 500 });
  }
}
