import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = requireRole(req, ['CREATOR']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await context.params; // activity_id

        const profile = await prisma.creatorProfile.findUnique({
            where: { user_id: session.userId }
        });

        if (!profile || !profile.is_verified) {
            return NextResponse.json({ error: 'Creator not verified' }, { status: 403 });
        }

        const application = await prisma.activityApplication.create({
            data: {
                activity_id: id,
                creator_id: session.userId,
                status: 'PENDING'
            }
        });

        return NextResponse.json({ success: true, application });
    } catch (error) {
        console.error('Apply for activity error:', error);
        return NextResponse.json({ error: 'Internal server error or already applied' }, { status: 500 });
    }
}
