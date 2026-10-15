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
        const { id } = await context.params; // this is the user_id
        const body = await req.json();

        const isVerified = Boolean(body.is_verified);
        const categoryTier = body.category_tier || (isVerified ? "Micro Creator" : null);

        const profile = await prisma.creatorProfile.update({
            where: { user_id: id },
            data: {
                is_verified: isVerified,
                category_tier: categoryTier
            }
        });

        if (isVerified) {
            await prisma.user.update({
                where: { id },
                data: { role: 'CREATOR' }
            });

            await prisma.notification.create({
                data: {
                    user_id: id,
                    type: 'GENERAL',
                    title: 'Creator Profile Verified',
                    message: `Congratulations! Your Creator Profile has been verified by the Sample Lelo Team as a ${categoryTier || "Creator"}. You now have full access to the Creator Dashboard and Activity Campaigns.`,
                    channel: 'DASHBOARD'
                }
            }).catch(e => console.error("Notification creation error:", e));
        } else {
            await prisma.notification.create({
                data: {
                    user_id: id,
                    type: 'GENERAL',
                    title: 'Creator Profile Status Updated',
                    message: 'Your creator profile status was updated. Please review your profile submissions or reach out to Sample Lelo support.',
                    channel: 'DASHBOARD'
                }
            }).catch(e => console.error("Notification creation error:", e));
        }

        return NextResponse.json({ success: true, profile });
    } catch (error) {
        console.error('Verify creator error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
