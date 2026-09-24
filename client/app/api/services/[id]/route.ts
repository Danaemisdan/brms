import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                tasks: true,
                forms: true,
                products: true
            }
        });

        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        
        return NextResponse.json({ service });
    } catch (error) {
        console.error('Fetch service error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
