import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const isPublic = searchParams.get('is_public');
        
        let whereClause = {};
        if (isPublic === 'true') {
            whereClause = { is_public: true };
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            orderBy: { created_at: 'desc' }
        });
        
        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Fetch tasks error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json();
        
        const task = await prisma.task.create({
            data: {
                title: body.title,
                description: body.description,
                image_url: body.image_url,
                action_text: body.action_text || null,
                action_url: body.action_url || null,
                reward_amount: parseFloat(body.reward_amount) || 0,
                is_public: body.is_public ?? true,
                service_id: body.service_id || null,
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error('Create task error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
