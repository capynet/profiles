// app/api/admin/users/[id]/role/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {auth} from '@/auth';
import {prisma} from '@/prisma';

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth();

        // Check if the user is authenticated and has admin role
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                {error: 'Unauthorized'},
                {status: 403}
            );
        }

        const userId = params.id;

        // Parse request body to get new role
        const body = await request.json();
        const {role} = body;

        // Validate role
        if (role !== 'user' && role !== 'admin') {
            return NextResponse.json(
                {error: 'Invalid role. Role must be either "user" or "admin"'},
                {status: 400}
            );
        }

        // Update user role
        const updatedUser = await prisma.user.update({
            where: {id: userId},
            data: {role},
            select: {id: true, email: true, role: true}
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user role:', error);
        return NextResponse.json(
            {error: 'Failed to update user role'},
            {status: 500}
        );
    }
}