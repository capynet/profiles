import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        // Verify the current user is an admin
        const session = await requireAdmin();

        // Get the user ID to impersonate
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Verify the target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Set impersonation cookies
        const cookieStore = await cookies();

        // Store the original admin ID and the impersonated user ID
        cookieStore.set('impersonating_user_id', userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        cookieStore.set('original_admin_id', session.user!.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error impersonating user:', error);
        return NextResponse.json(
            { error: 'Failed to impersonate user' },
            { status: 500 }
        );
    }
}

// Stop impersonating
export async function DELETE() {
    try {
        const cookieStore = await cookies();

        // Clear impersonation cookies
        cookieStore.delete('impersonating_user_id');
        cookieStore.delete('original_admin_id');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error stopping impersonation:', error);
        return NextResponse.json(
            { error: 'Failed to stop impersonation' },
            { status: 500 }
        );
    }
}
