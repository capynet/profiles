import {DataService} from '@/services/dataService';
import HomeClient from "./HomeClient";

export default async function Home() {
    // Get all languages and payment methods for filters
    const [languages, paymentMethods, initialProfiles] = await Promise.all([
        DataService.getAllLanguages(),
        DataService.getAllPaymentMethods(),
        DataService.getProfiles() // No filters for initial load
    ]);

    // Get Google Maps API key and Map ID from environment variables
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    const googleMapsId = process.env.GOOGLE_MAPS_ID;

    return (
        <div className="container mx-auto py-8 px-4">
            <HomeClient
                initialProfiles={initialProfiles}
                languages={languages}
                paymentMethods={paymentMethods}
                googleMapsApiKey={googleMapsApiKey}
                googleMapsId={googleMapsId}
            />
        </div>
    );
}