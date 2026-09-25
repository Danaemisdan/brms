import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireRole(req, ['CUSTOMER', 'CREATOR']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json();

        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const messageText = `I have completed the task "${task.title}".\n\nRemarks:\n${body.remarks || 'None'}\n\nProof Link:\n${body.proof_link || 'None'}`;

        const ticket = await prisma.ticket.create({
            data: {
                user_id: session.userId,
                subject: `Task Completion: ${task.title}`,
                messages: {
                    create: {
                        sender_id: session.userId,
                        text: messageText,
                        is_admin: false
                    }
                }
            }
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        console.error('Submit task error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
