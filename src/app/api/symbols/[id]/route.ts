import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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
    const { name, code1, code2, code3, note } = body;

    const symbol = await prisma.symbol.update({
      where: { id: numId },
      data: {
        name: name.substring(0, 10),
        code1: code1 || null,
        code2: code2 || null,
        code3: code3 || null,
        note: note ? note.substring(0, 255) : null,
      },
    });

    return NextResponse.json(symbol);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update symbol' }, { status: 500 });
  }
}
