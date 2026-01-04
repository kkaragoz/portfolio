import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || url.searchParams.get('search');
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { code: { contains: q, mode: 'insensitive' as const } },
            { code3: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined;
    const symbols = await prisma.symbol.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: q ? 10 : undefined,
    });
    return NextResponse.json(symbols);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch symbols' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, code1, code2, code3, note } = body;

    // Validate enums
    const validBirim = ['TL', 'Doviz', 'Karma'];
    const validTur = ['BIST', 'YABANCI_BORSA', 'KIYMETLI_METAL', 'EMTIA', 'PARA_PIYASASI', 'EUROBOND', 'KARMA', 'COIN'];
    
    if (code1 && !validBirim.includes(code1)) {
      return NextResponse.json({ error: 'Geçersiz birim değeri' }, { status: 400 });
    }
    if (code2 && !validTur.includes(code2)) {
      return NextResponse.json({ error: 'Geçersiz tür değeri' }, { status: 400 });
    }

    const symbol = await prisma.symbol.create({
      data: {
        name: name.substring(0, 255),
        code: code ? code.substring(0, 10) : null,
        code1: code1 || null,
        code2: code2 || null,
        code3: code3 ? code3.substring(0, 5) : null,
        note: note ? note.substring(0, 255) : null,
      },
    });

    return NextResponse.json(symbol, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create symbol' }, { status: 500 });
  }
}
