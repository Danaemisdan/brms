import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureAgentAuth } from '@/lib/agentAuth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = ensureAgentAuth(req);
    if (authError) return authError;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { status, remarks } = body;

        if (!['REFUNDED', 'FAILED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status update from agent.' }, { status: 400 });
        }

        await prisma.refund.update({
            where: { id },
            data: {
                status: status as string,
                ...(remarks && { batch_id: String(remarks).slice(0, 128) }),
            },
        });

        return NextResponse.json({ message: `Refund marked as ${status}` }, { status: 200 });
    } catch (error) {
        console.error('Agent Completion Error:', error);
        return NextResponse.json({ error: 'Failed to complete agent task.' }, { status: 500 });
    }
}
