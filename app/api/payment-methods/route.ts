import {NextResponse} from 'next/server';
import {DataService} from '@/services/dataService';

export const revalidate = 86400;

export async function GET() {
    try {
        const paymentMethods = await DataService.getAllPaymentMethods();
        return NextResponse.json(paymentMethods, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
            }
        });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return NextResponse.json({error: 'Failed to fetch payment methods'}, {status: 500});
    }
}