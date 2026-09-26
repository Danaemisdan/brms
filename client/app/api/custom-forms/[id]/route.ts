import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = requireRole(req, ['ADMIN', 'CUSTOMER', 'CREATOR']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await context.params;
        const form = await prisma.customForm.findUnique({
            where: { id },
            include: {
                records: session.role === 'ADMIN' ? {
                    orderBy: { created_at: 'desc' }
                } : false
            }
        });
        
        if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

        if (session.role !== 'ADMIN') {
            if (!form.is_public) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            if (form.target_audience === 'CUSTOMER_ONLY' && session.role !== 'CUSTOMER') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            if (form.target_audience === 'CREATOR_ONLY' && session.role !== 'CREATOR') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        return NextResponse.json(form);
    } catch (error) {
        console.error('Fetch custom form error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await context.params;
        const body = await req.json();

        const form = await prisma.customForm.update({
            where: { id },
            data: {
                name: body.name,
                sheet_name: body.sheet_name,
                fields: body.fields,
                is_public: body.is_public,
                target_audience: body.target_audience || "ALL",
                service_id: body.service_id || null,
            }
        });

        return NextResponse.json(form);
    } catch (error) {
        console.error('Update custom form error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await context.params;

        await prisma.customForm.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete custom form error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
