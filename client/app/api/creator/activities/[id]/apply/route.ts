import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = requireRole(req, ['CREATOR', 'CUSTOMER']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await context.params; // activity_id

        const profile = await prisma.creatorProfile.findUnique({
            where: { user_id: session.userId }
        });

        if (!profile || !profile.is_verified) {
            return NextResponse.json({ error: 'Creator not verified. Your profile must be verified by the Sample Lelo Team before applying.' }, { status: 403 });
        }

        const activity = await prisma.activity.findUnique({
            where: { id }
        });

        if (!activity || activity.status !== 'OPEN') {
            return NextResponse.json({ error: 'Activity is no longer accepting applications' }, { status: 400 });
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
        return NextResponse.json({ error: 'You have already applied for this activity or request failed' }, { status: 500 });
    }
}
