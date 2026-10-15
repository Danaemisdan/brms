export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['CREATOR', 'CUSTOMER']);
    if (session instanceof NextResponse) return session;

    try {
        let profile = await prisma.creatorProfile.findUnique({
            where: { user_id: session.userId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        mobile: true,
                        wallet_balance: true,
                        upi_id: true,
                        role: true
                    }
                }
            }
        });

        if (!profile) {
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: {
                    name: true,
                    email: true,
                    mobile: true,
                    wallet_balance: true,
                    upi_id: true,
                    role: true
                }
            });

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            profile = await prisma.creatorProfile.create({
                data: { user_id: session.userId },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            mobile: true,
                            wallet_balance: true,
                            upi_id: true,
                            role: true
                        }
                    }
                }
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

        const followerCount = parseInt(body.follower_count) || 0;
        const engagementRate = parseFloat(body.engagement_rate) || 0;

        // Auto-suggest category tier based on follower count if not explicitly set
        let suggestedTier = null;
        if (followerCount >= 100000) suggestedTier = "Macro Creator";
        else if (followerCount >= 25000) suggestedTier = "Mid-Tier Creator";
        else if (followerCount >= 5000) suggestedTier = "Micro Creator";
        else if (followerCount >= 500) suggestedTier = "Nano Creator";

        // Update profile
        const profile = await prisma.creatorProfile.upsert({
            where: { user_id: session.userId },
            update: {
                profile_urls: body.profile_urls || [],
                platforms: body.platforms || [],
                follower_range: body.follower_range || null,
                content_types: body.content_types || [],
                collaboration_types: body.collaboration_types || [],
                follower_count: followerCount,
                content_category: body.content_category || null,
                engagement_rate: engagementRate,
                ...(suggestedTier ? { category_tier: suggestedTier } : {})
            },
            create: {
                user_id: session.userId,
                profile_urls: body.profile_urls || [],
                platforms: body.platforms || [],
                follower_range: body.follower_range || null,
                content_types: body.content_types || [],
                collaboration_types: body.collaboration_types || [],
                follower_count: followerCount,
                content_category: body.content_category || null,
                engagement_rate: engagementRate,
                category_tier: suggestedTier || "Nano Creator"
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        mobile: true,
                        wallet_balance: true,
                        upi_id: true,
                        role: true
                    }
                }
            }
        });

        return NextResponse.json({ success: true, profile });
    } catch (error) {
        console.error('Update creator profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
