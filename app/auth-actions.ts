'use server';

import { signOut as authSignOut } from "@/auth";

export async function handleSignOut() {
    await authSignOut({ redirectTo: "/" });
}