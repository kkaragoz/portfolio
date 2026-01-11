import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.$queryRaw`
      SELECT * FROM rep_exchange ORDER BY value DESC
    `;

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('rep_exchange error:', error);
    return NextResponse.json({ error: 'Veri alınamadı' }, { status: 500 });
  }
}