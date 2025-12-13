import {NextResponse} from 'next/server';
import {DataService} from '@/services/dataService';

export const revalidate = 0;

export async function GET() {
    try {
        const paymentMethods = await DataService.getAllPaymentMethods();
        return NextResponse.json(paymentMethods, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return NextResponse.json({error: 'Failed to fetch payment methods'}, {status: 500});
    }
}