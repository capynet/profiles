// app/api/nationalities/route.ts
import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import {createApiLogger} from '@/lib/logger';

export const revalidate = 0;

export async function GET() {
    const log = createApiLogger('/api/nationalities', 'GET');

    try {
        const nationalities = await DataService.getAllNationalities();
        log.info({count: nationalities.length}, 'Nationalities fetched successfully');

        return NextResponse.json(nationalities, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        log.error({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to fetch nationalities');

        return NextResponse.json({ error: 'Failed to fetch nationalities' }, { status: 500 });
    }
}