import { Router } from 'express';
import { getTickets, getTicketMessages, createTicket, replyToTicket, resolveTicket } from './support.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Get all tickets
router.get('/', authMiddleware as any, getTickets);

// Create a new support ticket
router.post('/', authMiddleware as any, createTicket);

// Get messages for a specific ticket
router.get('/:id/messages', authMiddleware as any, getTicketMessages);

// Reply to a ticket
router.post('/:id/reply', authMiddleware as any, replyToTicket);

// Resolve a ticket
router.put('/:id/resolve', authMiddleware as any, resolveTicket);

export default router;
