import {DataService} from '@/services/dataService';
import {auth} from '@/auth';
import HomeClient from "./HomeClient";

export default async function Home() {
    // Get authenticated user
    const session = await auth();

    // Determine if user has a profile
    let userWithProfileInfo = null;
    if (session?.user) {
        const userProfiles = await DataService.getProfiles({userId: session.user.id});
        userWithProfileInfo = {
            id: session.user.id,
            hasProfile: userProfiles.length > 0
        };
    }

    // Get all languages, payment methods, nationalities, and ethnicities for filters
    const [languages, paymentMethods, nationalities, ethnicities, initialProfiles] = await Promise.all([
        DataService.getAllLanguages(),
        DataService.getAllPaymentMethods(),
        DataService.getAllNationalities(),
        DataService.getAllEthnicities(),
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
                nationalities={nationalities}
                ethnicities={ethnicities}
                googleMapsApiKey={googleMapsApiKey}
                googleMapsId={googleMapsId}
                user={userWithProfileInfo}
            />
        </div>
    );
}