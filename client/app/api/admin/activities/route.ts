import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const activities = await prisma.activity.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                applications: true
            }
        });
        
        return NextResponse.json(activities);
    } catch (error) {
        console.error('Fetch activities error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json();

        const activity = await prisma.activity.create({
            data: {
                title: body.title,
                description: body.description,
                requirements: body.requirements,
                reward_amount: parseFloat(body.reward_amount),
                deadline: body.deadline ? new Date(body.deadline) : null,
                status: 'OPEN'
            }
        });

        return NextResponse.json({ success: true, activity });
    } catch (error) {
        console.error('Create activity error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
