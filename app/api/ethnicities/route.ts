// app/api/ethnicities/route.ts
import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import {createApiLogger} from '@/lib/logger';

export const revalidate = 0;

export async function GET() {
    const log = createApiLogger('/api/ethnicities', 'GET');

    try {
        const ethnicities = await DataService.getAllEthnicities();
        log.info({count: ethnicities.length}, 'Ethnicities fetched successfully');

        return NextResponse.json(ethnicities, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        log.error({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to fetch ethnicities');

        return NextResponse.json({ error: 'Failed to fetch ethnicities' }, { status: 500 });
    }
}