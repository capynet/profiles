import {NextResponse} from 'next/server';
import {DataService} from '@/services/dataService';

export const revalidate = 0;

export async function GET() {
    try {
        const languages = await DataService.getAllLanguages();
        return NextResponse.json(languages, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        console.error('Error fetching languages:', error);
        return NextResponse.json({error: 'Failed to fetch languages'}, {status: 500});
    }
}