import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { symbol: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbolId, date, type, price, quantity, balance, note } = body;

    const transaction = await prisma.transaction.create({
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

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
