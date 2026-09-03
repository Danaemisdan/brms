import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const formatTicket = (ticket: any) => ({
    id: ticket.id,
    customer: ticket.user?.name,
    lastMessage: ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1].text : ticket.subject,
    unread: ticket.status === 'OPEN' && ticket.messages.length > 0 && !ticket.messages[ticket.messages.length - 1].is_admin,
    status: ticket.status,
    messages: ticket.messages.map((m: any) => ({
        id: m.id,
        from: m.is_admin ? "admin" : "customer",
        text: m.text,
        time: m.created_at.toLocaleString(),
        created_at: m.created_at
    }))
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                user: { select: { name: true } },
                messages: { orderBy: { created_at: 'asc' } }
            }
        });

        if (!ticket) {
            return NextResponse.json({ status: 'error', message: 'Ticket not found' }, { status: 404 });
        }

        if (session.role !== 'ADMIN' && ticket.user_id !== session.userId) {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({ status: 'success', data: formatTicket(ticket) }, { status: 200 });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to fetch messages' }, { status: 500 });
    }
}
