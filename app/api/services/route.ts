// app/api/services/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';

export const revalidate = 0;

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(services, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}