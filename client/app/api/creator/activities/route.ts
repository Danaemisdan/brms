import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['CREATOR']);
    if (session instanceof NextResponse) return session;

    try {
        const profile = await prisma.creatorProfile.findUnique({
            where: { user_id: session.userId }
        });

        if (!profile || !profile.is_verified) {
            return NextResponse.json({ error: 'Creator not verified' }, { status: 403 });
        }

        const activities = await prisma.activity.findMany({
            where: { status: 'OPEN' },
            orderBy: { created_at: 'desc' },
            include: {
                applications: {
                    where: { creator_id: session.userId }
                }
            }
        });
        
        return NextResponse.json(activities);
    } catch (error) {
        console.error('Fetch creator activities error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
