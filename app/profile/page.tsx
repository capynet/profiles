import {redirect} from 'next/navigation';
import {auth} from '@/auth';
import {DataService} from '@/services/dataService';
import ProfilePageClient from './ProfilePageClient';

export const metadata = {
    title: 'Mi Perfil',
    description: 'Visualiza y gestiona tu perfil profesional',
};

export default async function ProfilePage() {
    const session = await auth();

    // Verify user is authenticated
    if (!session) {
        redirect('/login');
    }

    // Get user profile
    const profiles = await DataService.getProfiles({userId: session.user?.id});
    const profile = profiles?.[0] || null;

    console.log('Server: Found profile?', !!profile);

    return (
        <div className="container mx-auto py-8 px-4">
            <ProfilePageClient profile={profile}/>
        </div>
    );
}