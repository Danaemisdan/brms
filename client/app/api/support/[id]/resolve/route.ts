import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket) {
            return NextResponse.json({ status: 'error', message: 'Ticket not found' }, { status: 404 });
        }

        if (session.role !== 'ADMIN' && ticket.user_id !== session.userId) {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: { status: 'RESOLVED' }
        });

        return NextResponse.json({ status: 'success', data: updatedTicket }, { status: 200 });
    } catch (error) {
        console.error('Error resolving ticket:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to resolve ticket' }, { status: 500 });
    }
}
