import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await context.params; // application_id
        const body = await req.json(); // { status: 'SHORTLISTED' | 'APPROVED' | 'REJECTED' }

        const application = await prisma.activityApplication.findUnique({
            where: { id },
            include: { activity: true }
        });

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const updated = await prisma.activityApplication.update({
            where: { id },
            data: {
                status: body.status,
                approved_at: body.status === 'APPROVED' ? new Date() : undefined
            }
        });

        // If APPROVED, credit the wallet
        if (body.status === 'APPROVED' && application.status !== 'APPROVED') {
            await prisma.user.update({
                where: { id: application.creator_id },
                data: {
                    wallet_balance: {
                        increment: application.activity.reward_amount
                    }
                }
            });
        }

        return NextResponse.json({ success: true, application: updated });
    } catch (error) {
        console.error('Update application status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
