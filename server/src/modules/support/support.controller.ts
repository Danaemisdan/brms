import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../config/database';

// Helper to format output matches the frontend requirements
const formatTicket = (ticket: any) => ({
    id: ticket.id,
    customer: ticket.user.name,
    lastMessage: ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1].text : ticket.subject,
    unread: ticket.status === 'OPEN' && ticket.messages.length > 0 && !ticket.messages[ticket.messages.length - 1].is_admin,
    status: ticket.status,
    messages: ticket.messages.map((m: any) => ({
        id: m.id,
        from: m.is_admin ? "admin" : "customer",
        text: m.text,
        time: m.created_at.toLocaleString(), // Simplistic time formatting, adjust as needed
        created_at: m.created_at
    }))
});

export const getTickets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        let tickets;
        if (userRole === 'ADMIN') {
            tickets = await prisma.ticket.findMany({
                include: {
                    user: { select: { name: true } },
                    messages: { orderBy: { created_at: 'asc' } }
                },
                orderBy: { updated_at: 'desc' }
            });
        } else {
            tickets = await prisma.ticket.findMany({
                where: { user_id: userId },
                include: {
                    user: { select: { name: true } },
                    messages: { orderBy: { created_at: 'asc' } }
                },
                orderBy: { updated_at: 'desc' }
            });
        }

        const formattedTickets = tickets.map(formatTicket);
        res.status(200).json({ status: 'success', data: formattedTickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch tickets' });
    }
};

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const { subject, message, order_id } = req.body;

        if (!subject || !message) {
            res.status(400).json({ status: 'error', message: 'Subject and message are required' });
            return;
        }

        const ticket = await prisma.ticket.create({
            data: {
                user_id: userId,
                subject,
                order_id: order_id || null,
                messages: {
                    create: {
                        sender_id: userId,
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

        res.status(201).json({ status: 'success', data: formatTicket(ticket) });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create ticket' });
    }
};

export const getTicketMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                user: { select: { name: true } },
                messages: { orderBy: { created_at: 'asc' } }
            }
        });

        if (!ticket) {
            res.status(404).json({ status: 'error', message: 'Ticket not found' });
            return;
        }

        if (userRole !== 'ADMIN' && ticket.user_id !== userId) {
            res.status(403).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        res.status(200).json({ status: 'success', data: formatTicket(ticket) });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch messages' });
    }
};

export const replyToTicket = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        if (!text) {
            res.status(400).json({ status: 'error', message: 'Message text is required' });
            return;
        }

        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket) {
            res.status(404).json({ status: 'error', message: 'Ticket not found' });
            return;
        }

        if (userRole !== 'ADMIN' && ticket.user_id !== userId) {
            res.status(403).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const isAdmin = userRole === 'ADMIN';

        const message = await prisma.message.create({
            data: {
                ticket_id: id,
                sender_id: userId,
                text,
                is_admin: isAdmin
            }
        });

        // Update ticket updated_at
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

        res.status(201).json({ status: 'success', data: formattedMessage });
    } catch (error) {
        console.error('Error replying to ticket:', error);
        res.status(500).json({ status: 'error', message: 'Failed to reply to ticket' });
    }
};

export const resolveTicket = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket) {
            res.status(404).json({ status: 'error', message: 'Ticket not found' });
            return;
        }

        if (userRole !== 'ADMIN' && ticket.user_id !== userId) {
            res.status(403).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: { status: 'RESOLVED' }
        });

        res.status(200).json({ status: 'success', data: updatedTicket });
    } catch (error) {
        console.error('Error resolving ticket:', error);
        res.status(500).json({ status: 'error', message: 'Failed to resolve ticket' });
    }
};
