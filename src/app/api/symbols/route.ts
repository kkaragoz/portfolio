import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const symbols = await prisma.symbol.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(symbols);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch symbols' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code1, code2, code3, note } = body;

    const symbol = await prisma.symbol.create({
      data: {
        name: name.substring(0, 10),
        code1: code1 || null,
        code2: code2 || null,
        code3: code3 || null,
        note: note ? note.substring(0, 255) : null,
      },
    });

    return NextResponse.json(symbol, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create symbol' }, { status: 500 });
  }
}
