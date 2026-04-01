import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const symbol = await prisma.symbol.findUnique({
      where: { id: parseInt(id) },
    });
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
    }
    return NextResponse.json(symbol);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch symbol' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);

    // Delete all transactions associated with this symbol first
    await prisma.transaction.deleteMany({
      where: { symbolId: numId },
    });

    // Then delete the symbol
    const symbol = await prisma.symbol.delete({
      where: { id: numId },
    });

    return NextResponse.json(symbol);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete symbol' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    const body = await request.json();
    const { name, code, code1, code2, code3, note, url } = body;

    // Validate enums
    const validBirim = ['TL', 'Doviz', 'Karma'];
    const validTur = ['BIST', 'YABANCI_BORSA', 'KIYMETLI_METAL', 'EMTIA', 'PARA_PIYASASI', 'EUROBOND', 'KARMA', 'COIN'];
    
    if (code1 && !validBirim.includes(code1)) {
      return NextResponse.json({ error: 'Geçersiz birim değeri' }, { status: 400 });
    }
    if (code2 && !validTur.includes(code2)) {
      return NextResponse.json({ error: 'Geçersiz tür değeri' }, { status: 400 });
    }

    const symbol = await prisma.symbol.update({
      where: { id: numId },
      data: {
        name: name.substring(0, 255),
        code: code ? code.substring(0, 10) : null,
        code1: code1 || null,
        code2: code2 || null,
        code3: code3 ? code3.substring(0, 5) : null,
        note: note ? note.substring(0, 255) : null,
        url: url ? url.substring(0, 500) : null,
      },
    });

    return NextResponse.json(symbol);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update symbol' }, { status: 500 });
  }
}
