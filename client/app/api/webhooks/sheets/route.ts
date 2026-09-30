import { NextRequest, NextResponse } from 'next/server';
import { pullUpdatesFromSheet } from '@/lib/services/googleSheets.service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        
        // If it's a specific cell edit from Apps Script
        if (body.sheetName && body.range) {
            console.log(`[Sheets Webhook] Targeted update received for ${body.sheetName} at ${body.range}. Value: ${body.value}`);
            // Trigger a background pull instead of blocking the webhook
            pullUpdatesFromSheet().catch(err => console.error("Background sync error:", err));
        } else {
            // Fallback for manual triggers / old webhooks
            await pullUpdatesFromSheet();
        }

        return NextResponse.json({ success: true, message: "Sync triggered successfully" }, { status: 200 });
    } catch (error) {
        console.error('[Webhooks] Sheets Sync Error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
