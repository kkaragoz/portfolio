import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const snapshots = await prisma.portfolioSnapshot.findMany({
      orderBy: { date: 'asc' }
    });
    
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Portfolio history fetch error:', error);
    return NextResponse.json(
      { error: 'Portföy geçmişi getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}
