import {NextResponse} from 'next/server';
import {DataService} from '@/services/dataService';

export async function GET() {
    try {
        const paymentMethods = await DataService.getAllPaymentMethods();
        return NextResponse.json(paymentMethods);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return NextResponse.json({error: 'Failed to fetch payment methods'}, {status: 500});
    }
}