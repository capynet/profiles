import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {auth} from "@/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

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
    const session = await auth();

    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900`}
        >
        <Header user={session?.user}/>
        <main className="flex-grow">
            {children}
        </main>
        <Footer/>
        </body>
        </html>
    );
}