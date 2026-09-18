import { NextRequest, NextResponse } from 'next/server';
import { pullUpdatesFromSheet } from '@/lib/services/googleSheets.service';

export async function POST(req: NextRequest) {
    try {
        // We no longer parse individual rows from the webhook payload.
        // Instead, we just trigger a full pull from the sheets to ensure consistency.
        await pullUpdatesFromSheet();

        return NextResponse.json({ success: true, message: "Sync triggered successfully" }, { status: 200 });
    } catch (error) {
        console.error('[Webhooks] Sheets Sync Error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
