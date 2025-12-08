import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);

    const transaction = await prisma.transaction.delete({
      where: { id: numId },
      include: { symbol: true },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
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
    const { symbolId, date, type, price, quantity, balance, note } = body;

    const transaction = await prisma.transaction.update({
      where: { id: numId },
      data: {
        symbolId: parseInt(symbolId),
        date: new Date(date),
        type: type.substring(0, 1),
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        balance: type === 'B' ? parseFloat(balance) : null,
        note: note ? note.substring(0, 255) : null,
      },
      include: { symbol: true },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
