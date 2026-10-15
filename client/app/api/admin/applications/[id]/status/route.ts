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
        const body = await req.json(); // { status, remarks }

        const application = await prisma.activityApplication.findUnique({
            where: { id },
            include: { activity: true }
        });

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const newStatus = body.status;
        const remarks = body.remarks || "";

        const updated = await prisma.activityApplication.update({
            where: { id },
            data: {
                status: newStatus,
                approved_at: newStatus === 'APPROVED' ? new Date() : undefined
            }
        });

        // 1. SHORTLISTED notification
        if (newStatus === 'SHORTLISTED') {
            await prisma.notification.create({
                data: {
                    user_id: application.creator_id,
                    type: 'GENERAL',
                    title: `Shortlisted: ${application.activity.title}`,
                    message: `Congratulations! You have been shortlisted for this activity. Please complete the required activity and submit your Reel link through the Creator Dashboard.`,
                    channel: 'DASHBOARD'
                }
            }).catch(e => console.error("Notification error:", e));
        }

        // 2. APPROVED notification & wallet credit
        if (newStatus === 'APPROVED' && application.status !== 'APPROVED') {
            await prisma.user.update({
                where: { id: application.creator_id },
                data: {
                    wallet_balance: {
                        increment: application.activity.reward_amount
                    }
                }
            });

            await prisma.notification.create({
                data: {
                    user_id: application.creator_id,
                    type: 'GENERAL',
                    title: `Reel Approved: ${application.activity.title}`,
                    message: `Your Reel for '${application.activity.title}' has been approved! ₹${application.activity.reward_amount} has been credited to your Creator Wallet. Approved payments are processed within 15 days of Reel approval.`,
                    channel: 'DASHBOARD'
                }
            }).catch(e => console.error("Notification error:", e));
        }

        // 3. REJECTED notification
        if (newStatus === 'REJECTED') {
            await prisma.notification.create({
                data: {
                    user_id: application.creator_id,
                    type: 'GENERAL',
                    title: `Activity Status: ${application.activity.title}`,
                    message: `Your application or submission for '${application.activity.title}' was rejected.${remarks ? ` Reason: ${remarks}` : ''}`,
                    channel: 'DASHBOARD'
                }
            }).catch(e => console.error("Notification error:", e));
        }

        // 4. CORRECTION_REQUIRED notification
        if (newStatus === 'CORRECTION_REQUIRED') {
            await prisma.notification.create({
                data: {
                    user_id: application.creator_id,
                    type: 'CORRECTION',
                    title: `Correction Required: ${application.activity.title}`,
                    message: `Corrections required for your submission on '${application.activity.title}'.${remarks ? ` Note: ${remarks}` : ' Please review guidelines and submit updated Reel link.'}`,
                    channel: 'DASHBOARD'
                }
            }).catch(e => console.error("Notification error:", e));
        }

        return NextResponse.json({ success: true, application: updated });
    } catch (error) {
        console.error('Update application status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
