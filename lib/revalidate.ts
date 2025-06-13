// lib/revalidate.ts
import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Revalidate profile-related cache when a profile is updated
 */
export async function revalidateProfile(profileId?: number) {
    try {
        // Revalidate the home page cache
        revalidatePath('/');
        
        // Revalidate specific profile page if ID provided
        if (profileId) {
            revalidatePath(`/profile/${profileId}`);
        }
        
        // Revalidate profile-related tags
        revalidateTag('profiles');
        
        console.log('Cache revalidated for profile:', profileId || 'all');
    } catch (error) {
        console.error('Error revalidating cache:', error);
    }
}

/**
 * Revalidate reference data cache when static data changes
 */
export async function revalidateReferenceData(type?: 'languages' | 'nationalities' | 'ethnicities' | 'payment-methods' | 'services') {
    try {
        if (type) {
            revalidateTag(type);
        } else {
            // Revalidate all reference data
            revalidateTag('reference-data');
        }
        
        console.log('Reference data cache revalidated:', type || 'all');
    } catch (error) {
        console.error('Error revalidating reference data cache:', error);
    }
}