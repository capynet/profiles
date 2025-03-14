import Google from "next-auth/providers/google"
import NextAuth from "next-auth"
import {PrismaAdapter} from "@auth/prisma-adapter"
import {prisma} from "@/prisma"


// Extend the session type to include role (necessary when const session = await auth();)
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: string;
        }
    }
}

export const {handlers, auth, signIn, signOut} = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [Google],
    callbacks: {
        async session({session, user}) {
            // Include the user's role and ID in the session
            if (session.user) {
                session.user.id = user.id;
                session.user.role = user.role as string;
            }
            return session;
        }
    }
})