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

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocaleFromCookie();
    const session = await auth();
    
    let userWithProfileInfo = null;
    if (session?.user) {
        // Get user's published profile (not drafts)
        const profile = await prisma.profile.findFirst({
            where: {
                userId: session.user.id,
                isDraft: false
            }
        });
        
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