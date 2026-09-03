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

export async function GET(req: NextRequest) {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    try {
        let tickets;
        if (session.role === 'ADMIN') {
            tickets = await prisma.ticket.findMany({
                include: {
                    user: { select: { name: true } },
                    messages: { orderBy: { created_at: 'asc' } }
                },
                orderBy: { updated_at: 'desc' }
            });
        } else {
            tickets = await prisma.ticket.findMany({
                where: { user_id: session.userId },
                include: {
                    user: { select: { name: true } },
                    messages: { orderBy: { created_at: 'asc' } }
                },
                orderBy: { updated_at: 'desc' }
            });
        }

        const formattedTickets = tickets.map(formatTicket);
        return NextResponse.json({ status: 'success', data: formattedTickets }, { status: 200 });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to fetch tickets' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json().catch(() => ({}));
        const { subject, message, order_id } = body;

        if (!subject || !message) {
            return NextResponse.json({ status: 'error', message: 'Subject and message are required' }, { status: 400 });
        }

        const ticket = await prisma.ticket.create({
            data: {
                user_id: session.userId,
                subject,
                order_id: order_id || null,
                messages: {
                    create: {
                        sender_id: session.userId,
                        text: message,
                        is_admin: false
                    }
                }
            },
            include: {
                user: { select: { name: true } },
                messages: true
            }
        });

        return NextResponse.json({ status: 'success', data: formatTicket(ticket) }, { status: 201 });
    } catch (error) {
        console.error('Error creating ticket:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to create ticket' }, { status: 500 });
    }
}
