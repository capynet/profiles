import {redirect} from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import {DataService} from '@/services/dataService';
import {auth} from '@/auth';

export const metadata = {
    title: 'Edit profile',
    description: 'Edita tu perfil profesional',
};

export default async function EditProfilePage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect('/login');
    }

    const profiles = await DataService.getProfiles({userId: session.user.id});
    const profile = profiles[0];

    if (!profile) {
        redirect('/profile/create');
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Edit Your Profile</h1>
            <ProfileForm profile={profile} isEditing={true}/>
        </div>
    );
}