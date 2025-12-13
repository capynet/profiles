// app/api/ethnicities/route.ts
import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';

export const revalidate = 0;

export async function GET() {
    try {
        const ethnicities = await DataService.getAllEthnicities();
        return NextResponse.json(ethnicities, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        console.error('Error fetching ethnicities:', error);
        return NextResponse.json({ error: 'Failed to fetch ethnicities' }, { status: 500 });
    }
}