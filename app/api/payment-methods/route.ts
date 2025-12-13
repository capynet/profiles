import {NextResponse} from 'next/server';
import {DataService} from '@/services/dataService';
import {createApiLogger} from '@/lib/logger';

export const revalidate = 0;

export async function GET() {
    const log = createApiLogger('/api/payment-methods', 'GET');

    try {
        const paymentMethods = await DataService.getAllPaymentMethods();
        log.info({count: paymentMethods.length}, 'Payment methods fetched successfully');

        return NextResponse.json(paymentMethods, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        log.error({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to fetch payment methods');

        return NextResponse.json({error: 'Failed to fetch payment methods'}, {status: 500});
    }
}