// app/admin/entities/page.tsx
import {requireAdmin} from '@/lib/auth-utils';
import {prisma} from '@/prisma';
import EntitiesManagement from '@/components/EntitiesManagement';

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Manage Entities - Admin',
    description: 'Manage languages, services, payment methods, nationalities, and ethnicities',
};

export default async function EntitiesPage() {
    // This ensures only admin users can access this page
    await requireAdmin();

    // Fetch all entities
    const [languages, services, paymentMethods, nationalities, ethnicities] = await Promise.all([
        prisma.language.findMany({
            orderBy: {name: 'asc'},
        }),
        prisma.service.findMany({
            orderBy: {name: 'asc'},
        }),
        prisma.paymentMethod.findMany({
            orderBy: {name: 'asc'},
        }),
        prisma.nationality.findMany({
            orderBy: {name: 'asc'},
        }),
        prisma.ethnicity.findMany({
            orderBy: {name: 'asc'},
        }),
    ]);

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">Manage Entities</h1>
            <EntitiesManagement
                initialLanguages={languages}
                initialServices={services}
                initialPaymentMethods={paymentMethods}
                initialNationalities={nationalities}
                initialEthnicities={ethnicities}
            />
        </div>
    );
}
