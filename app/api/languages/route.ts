import {NextResponse} from 'next/server';
import {DataService} from '@/services/dataService';
import {createApiLogger} from '@/lib/logger';

export const revalidate = 0;

export async function GET() {
    const log = createApiLogger('/api/languages', 'GET');

    try {
        const languages = await DataService.getAllLanguages();
        log.info({count: languages.length}, 'Languages fetched successfully');

        return NextResponse.json(languages, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        log.error({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to fetch languages');

        return NextResponse.json({error: 'Failed to fetch languages'}, {status: 500});
    }
}