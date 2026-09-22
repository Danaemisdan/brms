import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await context.params;
        const form = await prisma.customForm.findUnique({
            where: { id },
            include: {
                records: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        
        if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

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
