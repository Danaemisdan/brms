import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const services = await prisma.service.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'asc' }
        });
        return NextResponse.json({ services });
    } catch (error) {
        console.error('Fetch services error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json();
        const service = await prisma.service.create({
            data: {
                name: body.name,
                description: body.description,
                icon: body.icon
            }
        });
        return NextResponse.json({ service });
    } catch (error) {
        console.error('Create service error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
