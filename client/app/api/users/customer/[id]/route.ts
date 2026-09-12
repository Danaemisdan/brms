import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        
        const updateData: any = {};
        if (body.name) updateData.name = body.name;
        if (body.mobile) updateData.mobile = body.mobile;
        if (body.email !== undefined) updateData.email = body.email;
        
        if (body.password) {
            updateData.password_hash = await bcrypt.hash(body.password, 10);
            // Optionally increment token_version when password is changed to force logout
            updateData.token_version = { increment: 1 };
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No data to update' }, { status: 400 });
        }

        const updatedCustomer = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, name: true, mobile: true, email: true }
        });

        return NextResponse.json({ message: 'Customer updated successfully', customer: updatedCustomer }, { status: 200 });
    } catch (error: any) {
        console.error('Failed to update customer:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Mobile or Email already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
}
