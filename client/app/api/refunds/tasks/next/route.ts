import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureAgentAuth } from '@/lib/agentAuth';

type QueueTaskType = 'REVIEW_VERIFY' | 'WHATSAPP_BLAST';

function parseTaskType(value: string | undefined): QueueTaskType | null {
    if (value === 'REVIEW_VERIFY' || value === 'WHATSAPP_BLAST') return value as QueueTaskType;
    return null;
}

export async function GET(req: NextRequest) {
    const authError = ensureAgentAuth(req);
    if (authError) return authError;

    try {
        const url = new URL(req.url);
        const taskType = parseTaskType(url.searchParams.get('type') || '');
        if (!taskType) {
            return NextResponse.json({ error: 'Invalid or missing task type.' }, { status: 400 });
        }

        const workerId = url.searchParams.get('worker_id') || 'local-agent';
        const now = new Date();

        const candidate = await prisma.agentTask.findFirst({
            where: {
                task_type: taskType,
                status: 'PENDING',
                available_at: { lte: now },
            },
            orderBy: [{ created_at: 'asc' }],
        });

        if (!candidate) {
            return NextResponse.json({ task: null }, { status: 200 });
        }

        const claimed = await prisma.agentTask.updateMany({
            where: {
                id: candidate.id,
                status: 'PENDING',
            },
            data: {
                status: 'IN_PROGRESS',
                locked_by: workerId,
                locked_at: now,
                attempts: { increment: 1 },
            },
        });

        if (claimed.count === 0) {
            return NextResponse.json({ task: null }, { status: 200 });
        }

        const task = await prisma.agentTask.findUnique({ where: { id: candidate.id } });
        if (!task) {
            return NextResponse.json({ task: null }, { status: 200 });
        }

        return NextResponse.json({
            task: {
                id: task.id,
                type: task.task_type,
                status: task.status,
                payload: JSON.parse(task.payload),
                attempts: task.attempts,
                created_at: task.created_at,
            },
        }, { status: 200 });
    } catch (error) {
        console.error('Agent task claim error:', error);
        return NextResponse.json({ error: 'Failed to claim task.' }, { status: 500 });
    }
}
