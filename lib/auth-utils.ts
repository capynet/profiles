// lib/auth-utils.ts
import {auth} from "@/auth";
import {forbidden, redirect} from "next/navigation";

// Check if the current user is authenticated and has the admin role
export async function requireAdmin() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    if (session.user?.role !== "admin") {
        forbidden()
    }

    return session;
}
