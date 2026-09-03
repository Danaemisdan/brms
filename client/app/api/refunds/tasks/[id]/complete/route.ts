import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureAgentAuth } from '@/lib/agentAuth';

type QueueTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = ensureAgentAuth(req);
    if (authError) return authError;

    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const {
            status,
            result,
            retry_after_seconds,
        }: {
            status: QueueTaskStatus;
            result?: unknown;
            retry_after_seconds?: number;
        } = body;

        if (!['COMPLETED', 'FAILED', 'PENDING'].includes(status)) {
            return NextResponse.json({ error: 'Invalid completion status.' }, { status: 400 });
        }

        const data: {
            status: QueueTaskStatus;
            result?: string;
            available_at?: Date;
            locked_at: null;
            locked_by: null;
        } = {
            status,
            locked_at: null,
            locked_by: null,
        };

        if (typeof result !== 'undefined') {
            data.result = JSON.stringify(result);
        }

        if (status === 'PENDING' || (status === 'FAILED' && retry_after_seconds && retry_after_seconds > 0)) {
            data.status = 'PENDING';
            data.available_at = new Date(Date.now() + retry_after_seconds! * 1000);
        }

        await prisma.agentTask.update({
            where: { id },
            data,
        });

        return NextResponse.json({ message: 'Task updated.' }, { status: 200 });
    } catch (error) {
        console.error('Agent task complete error:', error);
        return NextResponse.json({ error: 'Failed to update task.' }, { status: 500 });
    }
}
