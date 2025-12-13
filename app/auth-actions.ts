'use server';

import {signIn, signOut as authSignOut} from "@/auth";

export async function handleSignIn() {
    await signIn("google", {redirectTo: "/"});
}

export async function handleSignOut() {
    await authSignOut({redirectTo: "/"});
}