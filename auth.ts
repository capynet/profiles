import Google from "next-auth/providers/google"
import NextAuth from "next-auth"
import {PrismaAdapter} from "@auth/prisma-adapter"
import {prisma} from "@/prisma"


declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: string;
            profileId?: number;
            hasProfile?: boolean;
        }
        impersonatingUserId?: string;
        originalAdminId?: string;
    }
}

export const {handlers, auth, signIn, signOut} = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            allowDangerousEmailAccountLinking: true
        })
    ],
    callbacks: {
        async session({session, user}) {
            // Check if we're impersonating a user
            const {cookies} = await import('next/headers');
            const cookieStore = await cookies();
            const impersonatingUserId = cookieStore.get('impersonating_user_id')?.value;
            const originalAdminId = cookieStore.get('original_admin_id')?.value;

            // Determine which user data to load
            let targetUserId = user.id;

            if (impersonatingUserId && originalAdminId === user.id) {
                // Admin is impersonating another user
                targetUserId = impersonatingUserId;
                session.impersonatingUserId = impersonatingUserId;
                session.originalAdminId = originalAdminId;

                // Fetch the impersonated user's data
                const impersonatedUser = await prisma.user.findUnique({
                    where: { id: impersonatingUserId }
                });

                if (impersonatedUser) {
                    session.user.id = impersonatedUser.id;
                    session.user.name = impersonatedUser.name;
                    session.user.email = impersonatedUser.email;
                    session.user.image = impersonatedUser.image;
                    session.user.role = (impersonatedUser as any).role as string;
                }
            } else {
                // Normal session (not impersonating)
                session.user.id = user.id;
                session.user.role = (user as any).role as string;
            }

            // Look up the user's profile if it exists
            try {
                const profile = await prisma.profile.findFirst({
                    where: {
                        userId: targetUserId,
                        published: true,
                        isDraft: false
                    },
                    orderBy: { updatedAt: 'desc' }
                });

                if (profile) {
                    session.user.profileId = profile.id;
                    session.user.hasProfile = true;
                } else {
                    // Check if they have any profile (including drafts)
                    const profileCount = await prisma.profile.count({
                        where: { userId: targetUserId }
                    });
                    session.user.hasProfile = profileCount > 0;
                }
            } catch (error) {
                console.error('Error fetching profile for session:', error);
            }

            return session;
        }
    }
})