// app/api/ethnicities/route.ts
import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';

export const revalidate = 86400;

export async function GET() {
    try {
        const ethnicities = await DataService.getAllEthnicities();
        return NextResponse.json(ethnicities, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
            }
        });
    } catch (error) {
        console.error('Error fetching ethnicities:', error);
        return NextResponse.json({ error: 'Failed to fetch ethnicities' }, { status: 500 });
    }
}