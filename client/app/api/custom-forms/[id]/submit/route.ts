import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { syncCustomRecordToSheet } from '@/lib/services/googleSheets.service';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = requireAuth(req);
    // Don't enforce ADMIN role here if we eventually want users to submit, but for now we can enforce it.
    // The user requested "only for admin ofc" so let's verify admin status.
    if (session instanceof NextResponse) return session;
    if (session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id } = await context.params;
        const body = await req.json();

        const form = await prisma.customForm.findUnique({
            where: { id }
        });

        if (!form) {
            return NextResponse.json({ error: 'Form not found' }, { status: 404 });
        }

        // Save data to CustomRecord
        const record = await prisma.customRecord.create({
            data: {
                form_id: form.id,
                user_id: session.userId,
                data: body.data,
            }
        });

        // Async sync to Google Sheets
        syncCustomRecordToSheet(form, record).catch(console.error);

        return NextResponse.json({ success: true, record });
    } catch (error) {
        console.error('Submit custom form error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
