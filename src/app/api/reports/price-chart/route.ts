import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const symbolId = url.searchParams.get('symbolId');

    if (!symbolId) {
      return NextResponse.json({ error: 'symbolId parametresi gerekli' }, { status: 400 });
    }

    const id = parseInt(symbolId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Geçersiz symbolId' }, { status: 400 });
    }

    const prices = await prisma.price.findMany({
      where: { symbolId: id },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        price: true,
      },
    });

    return NextResponse.json(prices);
  } catch (error) {
    return NextResponse.json({ error: 'Fiyat verileri alınamadı' }, { status: 500 });
  }
}
