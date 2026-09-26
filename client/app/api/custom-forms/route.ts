import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const forms = await prisma.customForm.findMany({
            orderBy: { created_at: 'desc' }
        });
        
        return NextResponse.json(forms);
    } catch (error) {
        console.error('Fetch custom forms error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const body = await req.json();
        
        const form = await prisma.customForm.create({
            data: {
                name: body.name,
                sheet_name: body.sheet_name,
                fields: body.fields || [],
                is_public: body.is_public ?? false,
                target_audience: body.target_audience || "ALL",
                service_id: body.service_id || null,
            }
        });

        return NextResponse.json(form);
    } catch (error) {
        console.error('Create custom form error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
