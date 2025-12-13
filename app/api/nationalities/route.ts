// app/api/nationalities/route.ts
import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';

export const revalidate = 0;

export async function GET() {
    try {
        const nationalities = await DataService.getAllNationalities();
        return NextResponse.json(nationalities, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        console.error('Error fetching nationalities:', error);
        return NextResponse.json({ error: 'Failed to fetch nationalities' }, { status: 500 });
    }
}