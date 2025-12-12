// app/layout.tsx
import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {auth} from "@/auth";
import {prisma} from "@/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
import { getLocaleFromCookie } from '@/lib/cookie-utils';
import {NextIntlClientProvider} from "next-intl";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { unstable_cache } from 'next/cache';
import { Toaster } from 'sonner';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Profiles App",
    description: "Find and connect with professionals",
};

// Cache user profile lookup to avoid repeated DB queries
const getUserProfile = unstable_cache(
    async (userId: string) => {
        return await prisma.profile.findFirst({
            where: {
                userId: userId,
                isDraft: false
            },
            select: {
                id: true,
                published: true
            }
        });
    },
    ['user-profile'],
    {
        tags: ['user-profile', 'profiles'],
        revalidate: 60 // Revalidate every minute
    }
);

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocaleFromCookie();
    const session = await auth();

    let userWithProfileInfo = null;
    if (session?.user) {
        // Get user's published profile (not drafts) - using cached function
        const profile = await getUserProfile(session.user.id);

        userWithProfileInfo = {
            ...session.user,
            hasProfile: !!profile,
            profilePublished: profile?.published || false
        };
    }

    return (
        <html lang={locale} suppressHydrationWarning>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900`}
        >
        <SpeedInsights/>
        <Toaster position="top-right" richColors />
        <NextIntlClientProvider locale={locale}>
            <Header user={userWithProfileInfo}/>
            <main className="flex-grow">
                {children}
            </main>
            <Footer/>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}