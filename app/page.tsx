import {auth} from "@/auth";
import {DataService} from '@/services/dataService';
import Header from "@/components/Header";
import HomeClient from "./HomeClient";

export default async function Home() {
    const session = await auth();

    // Get all languages and payment methods for filters
    const [languages, paymentMethods, initialProfiles] = await Promise.all([
        DataService.getAllLanguages(),
        DataService.getAllPaymentMethods(),
        DataService.getProfiles() // No filters for initial load
    ]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Header with user info */}
            <Header user={session?.user} />

            {/* Main content */}
            <main className="flex-grow">
                <HomeClient
                    initialProfiles={initialProfiles}
                    languages={languages}
                    paymentMethods={paymentMethods}
                />
            </main>

            {/* Footer */}
            <footer className="py-4 px-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="container mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
                    &copy; {new Date().getFullYear()} Profiles App. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
}