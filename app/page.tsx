import {DataService} from '@/services/dataService';
import HomeClient from "./HomeClient";

export default async function Home() {
    // Get all languages and payment methods for filters
    const [languages, paymentMethods, initialProfiles] = await Promise.all([
        DataService.getAllLanguages(),
        DataService.getAllPaymentMethods(),
        DataService.getProfiles() // No filters for initial load
    ]);

    return (
        <div className="container mx-auto py-8 px-4">
            <HomeClient
                initialProfiles={initialProfiles}
                languages={languages}
                paymentMethods={paymentMethods}
            />
        </div>
    );
}