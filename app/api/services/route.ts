// app/api/services/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import {createApiLogger} from '@/lib/logger';

export const revalidate = 0;

export async function GET() {
  const log = createApiLogger('/api/services', 'GET');

  try {
    const services = await prisma.service.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    log.info({count: services.length}, 'Services fetched successfully');

    return NextResponse.json(services, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    log.error({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, 'Failed to fetch services');

    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}