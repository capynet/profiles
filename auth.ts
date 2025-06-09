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
            // Include the user's role and ID in the session
            if (session.user) {
                session.user.id = user.id;
                session.user.role = (user as any).role as string;
                
                // Look up the user's profile if it exists
                try {
                    const profile = await prisma.profile.findFirst({
                        where: { 
                            userId: user.id,
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
                            where: { userId: user.id }
                        });
                        session.user.hasProfile = profileCount > 0;
                    }
                } catch (error) {
                    console.error('Error fetching profile for session:', error);
                }
            }
            return session;
        }
    }
})