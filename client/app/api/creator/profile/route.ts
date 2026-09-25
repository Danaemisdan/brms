import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['CREATOR', 'CUSTOMER']);
    if (session instanceof NextResponse) return session;

    try {
        let profile = await prisma.creatorProfile.findUnique({
            where: { user_id: session.userId }
        });

        if (!profile) {
            // Create a stub profile if missing
            profile = await prisma.creatorProfile.create({
                data: { user_id: session.userId }
            });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Fetch creator profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['CREATOR', 'CUSTOMER']);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json();

        // Update profile
        const profile = await prisma.creatorProfile.upsert({
            where: { user_id: session.userId },
            update: {
                profile_urls: body.profile_urls || [],
                platforms: body.platforms || [],
                follower_range: body.follower_range || null,
                content_types: body.content_types || [],
                collaboration_types: body.collaboration_types || [],
                follower_count: parseInt(body.follower_count) || 0,
                content_category: body.content_category,
                engagement_rate: parseFloat(body.engagement_rate) || 0,
            },
            create: {
                user_id: session.userId,
                profile_urls: body.profile_urls || [],
                platforms: body.platforms || [],
                follower_range: body.follower_range || null,
                content_types: body.content_types || [],
                collaboration_types: body.collaboration_types || [],
                follower_count: parseInt(body.follower_count) || 0,
                content_category: body.content_category,
                engagement_rate: parseFloat(body.engagement_rate) || 0,
            }
        });

        return NextResponse.json({ success: true, profile });
    } catch (error) {
        console.error('Update creator profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
