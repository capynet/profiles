import {redirect} from 'next/navigation';
import ProfileFormWithActions from '@/components/ProfileFormWithActions';
import {DataService} from '@/services/dataService';
import {auth} from '@/auth';

export const metadata = {
    title: 'Edit profile',
    description: 'Edita tu perfil profesional',
};

export default async function EditProfilePage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const profiles = await DataService.getProfiles({userId: session.user.id});
    const profile = profiles[0];

    if (!profile) {
        redirect('/profile/create');
    }

    return (
        <div className="container mx-auto py-8">
            <ProfileFormWithActions profile={profile} isEditing={true}/>
        </div>
    );
}