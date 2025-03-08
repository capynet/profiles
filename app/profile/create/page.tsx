import {redirect} from 'next/navigation';
import {auth} from '@/auth';
import ProfileForm from "@/components/ProfileForm";
import {DataService} from '@/services/dataService';

export const metadata = {
    title: 'Create profile',
    description: 'Fill your profile',
};

export default async function CreateProfilePage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect('/login');
    }

    const profiles = await DataService.getProfiles({userId: session.user.id});
    const existingProfile = profiles[0];

    if (existingProfile) {
        redirect(`/profile/edit`);
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Create Your Profile</h1>
            <ProfileForm/>
        </div>
    );
}