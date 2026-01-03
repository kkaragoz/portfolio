import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  try {
    // Execute stored procedure to calculate FIFO (schema-qualified)
    // Using unsafe raw to avoid tag parsing issues with CALL
    await prisma.$executeRawUnsafe('CALL public.calcfifo()');
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error?.message || 'Failed to run FIFO calculation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
