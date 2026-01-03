import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.$queryRaw`
      SELECT * FROM rep_category
    `;

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('rep_category error:', error);
    return NextResponse.json([], { status: 200 });
  }
}