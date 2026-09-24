import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { syncCustomRecordToSheet } from '@/lib/services/googleSheets.service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = requireAuth(req);
    if (session instanceof NextResponse) return session;

    try {
        const { id } = await params;
        const body = await req.json();
        
        const form = await prisma.customForm.findUnique({
            where: { id }
        });

        if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

        // Save record to DB
        const record = await prisma.customRecord.create({
            data: {
                form_id: id,
                user_id: session.id, // Assuming session returns user payload
                data: body.data
            }
        });

        // Map data to sheet format
        try {
            await syncCustomRecordToSheet(form, record);
        } catch (sheetError) {
            console.error("Failed to sync custom record to sheet:", sheetError);
            // We don't fail the request if sheet sync fails, just log it.
        }

        return NextResponse.json({ success: true, record }, { status: 201 });
    } catch (error) {
        console.error('Submit custom form error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
