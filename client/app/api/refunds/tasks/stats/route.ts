import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const grouped = await prisma.agentTask.groupBy({
            by: ['task_type', 'status'],
            _count: { _all: true },
        });

        const stats: Record<string, Record<string, number>> = {};
        for (const row of grouped) {
            if (!stats[row.task_type]) stats[row.task_type] = {};
            stats[row.task_type][row.status] = row._count._all;
        }

        return NextResponse.json({ stats }, { status: 200 });
    } catch (error) {
        console.error('Agent task stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch task stats.' }, { status: 500 });
    }
}
