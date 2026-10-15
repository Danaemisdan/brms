export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const creators = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'CREATOR' },
                    { creator_profile: { isNot: null } }
                ]
            },
            include: { creator_profile: true },
            orderBy: { created_at: 'desc' }
        });
        
        return NextResponse.json(creators);
    } catch (error) {
        console.error('Fetch creators error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
