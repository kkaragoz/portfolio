import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.$queryRaw<Array<{exchange: string; symbol_count: bigint; total_value: bigint | null}>>`
      SELECT * FROM rep_exchange ORDER BY total_value DESC
    `;

    const formatted = data.map(item => ({
      exchange: item.exchange,
      symbol_count: Number(item.symbol_count),
      total_value: item.total_value ? Number(item.total_value) : 0
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('rep_exchange error:', error);
    return NextResponse.json({ error: 'Veri alınamadı' }, { status: 500 });
  }
}