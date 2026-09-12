import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        
        await prisma.user.update({
            where: { id },
            data: {
                token_version: { increment: 1 }
            }
        });

        return NextResponse.json({ message: 'Customer logged out from all devices successfully' }, { status: 200 });
    } catch (error) {
        console.error('Failed to force logout customer:', error);
        return NextResponse.json({ error: 'Failed to force logout customer' }, { status: 500 });
    }
}
