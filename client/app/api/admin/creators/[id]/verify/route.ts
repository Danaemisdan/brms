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
        const { id } = await context.params; // this is the user_id or profile_id. Let's assume user_id.
        const body = await req.json();

        const profile = await prisma.creatorProfile.update({
            where: { user_id: id },
            data: {
                is_verified: body.is_verified,
                category_tier: body.category_tier
            }
        });

        return NextResponse.json({ success: true, profile });
    } catch (error) {
        console.error('Verify creator error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
