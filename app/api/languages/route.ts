import {NextResponse} from 'next/server';
import {DataService} from '@/services/dataService';

export const revalidate = 86400;

export async function GET() {
    try {
        const languages = await DataService.getAllLanguages();
        return NextResponse.json(languages, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
            }
        });
    } catch (error) {
        console.error('Error fetching languages:', error);
        return NextResponse.json({error: 'Failed to fetch languages'}, {status: 500});
    }
}