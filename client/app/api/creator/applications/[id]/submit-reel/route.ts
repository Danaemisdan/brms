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
        const { id } = await context.params; // application_id
        const body = await req.json();

        if (!body.reel_link || typeof body.reel_link !== 'string' || !body.reel_link.trim()) {
            return NextResponse.json({ error: 'Valid Reel link is required' }, { status: 400 });
        }

        const application = await prisma.activityApplication.findUnique({
            where: { id },
            include: { activity: true }
        });

        if (!application || application.creator_id !== session.userId) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const allowedStatuses = ['SHORTLISTED', 'CORRECTION_REQUIRED', 'SUBMITTED'];
        if (!allowedStatuses.includes(application.status)) {
            return NextResponse.json({ 
                error: 'Only shortlisted creators can submit Reel links for this activity.' 
            }, { status: 400 });
        }

        const updated = await prisma.activityApplication.update({
            where: { id },
            data: {
                reel_link: body.reel_link.trim(),
                status: 'SUBMITTED',
                submitted_at: new Date()
            }
        });

        // Notify creator that submission was received
        await prisma.notification.create({
            data: {
                user_id: session.userId,
                type: 'GENERAL',
                title: 'Reel Link Submitted',
                message: `Your Reel link for '${application.activity.title}' has been submitted and is currently being reviewed by the Sample Lelo Team. Approved payments are processed within 15 days.`,
                channel: 'DASHBOARD'
            }
        }).catch(e => console.error("Notification error:", e));

        return NextResponse.json({ success: true, application: updated });
    } catch (error) {
        console.error('Submit reel error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
