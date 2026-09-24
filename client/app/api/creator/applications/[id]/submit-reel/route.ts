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
        const { id } = await context.params; // application_id
        const body = await req.json();

        if (!body.reel_link) {
            return NextResponse.json({ error: 'Reel link is required' }, { status: 400 });
        }

        const application = await prisma.activityApplication.findUnique({
            where: { id }
        });

        if (!application || application.creator_id !== session.userId) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        if (application.status !== 'SHORTLISTED') {
            return NextResponse.json({ error: 'Can only submit reel if shortlisted' }, { status: 400 });
        }

        const updated = await prisma.activityApplication.update({
            where: { id },
            data: {
                reel_link: body.reel_link,
                status: 'SUBMITTED',
                submitted_at: new Date()
            }
        });

        return NextResponse.json({ success: true, application: updated });
    } catch (error) {
        console.error('Submit reel error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
