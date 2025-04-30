// app/layout.tsx
import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {auth} from "@/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {prisma} from "@/prisma";
import "./globals.css";
import {getLocale} from 'next-intl/server';
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
    const locale = await getLocale();
    const session = await auth();

    // Check if user has any type of profile (including drafts)
    let userWithProfileInfo = null;
    if (session?.user) {
        // Check for any profile (published or draft)
        const profileCount = await prisma.profile.count({
            where: {
                userId: session.user.id
            }
        });

        userWithProfileInfo = {
            ...session.user,
            hasProfile: profileCount > 0
        };
    }

    return (
        <html lang={locale} suppressHydrationWarning>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900`}
        >
        <Header user={userWithProfileInfo}/>
        <main className="flex-grow">
            <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </main>
        <Footer/>
        </body>
        </html>
    );
}