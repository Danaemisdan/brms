import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await context.params;
        const body = await req.json();

        const task = await prisma.task.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                image_url: body.image_url,
                action_text: body.action_text || null,
                action_url: body.action_url || null,
                reward_amount: parseFloat(body.reward_amount) || 0,
                is_public: body.is_public,
                target_audience: body.target_audience || "ALL",
                service_id: body.service_id || null,
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await context.params;

        await prisma.task.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete task error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
