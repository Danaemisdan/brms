import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { text } = body;

        if (!text) {
            return NextResponse.json({ status: 'error', message: 'Message text is required' }, { status: 400 });
        }

        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket) {
            return NextResponse.json({ status: 'error', message: 'Ticket not found' }, { status: 404 });
        }

        if (session.role !== 'ADMIN' && ticket.user_id !== session.userId) {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });
        }

        const isAdmin = session.role === 'ADMIN';

        const message = await prisma.message.create({
            data: {
                ticket_id: id,
                sender_id: session.userId,
                text,
                is_admin: isAdmin
            }
        });

        await prisma.ticket.update({
            where: { id },
            data: { updated_at: new Date() }
        });

        const formattedMessage = {
            id: message.id,
            from: message.is_admin ? "admin" : "customer",
            text: message.text,
            time: message.created_at.toLocaleString(),
            created_at: message.created_at
        };

        return NextResponse.json({ status: 'success', data: formattedMessage }, { status: 201 });
    } catch (error) {
        console.error('Error replying to ticket:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to reply to ticket' }, { status: 500 });
    }
}
