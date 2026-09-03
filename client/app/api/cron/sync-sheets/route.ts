import { NextRequest, NextResponse } from 'next/server';
import { pullUpdatesFromSheet } from '@/lib/services/googleSheets.service';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        await pullUpdatesFromSheet();
        return NextResponse.json({ success: true, message: "Successfully synced with Google Sheets." }, { status: 200 });
    } catch (error) {
        console.error("[Google Sheets Sync] Job Failed:", error);
        return NextResponse.json({ success: false, message: "Failed to sync with Google Sheets." }, { status: 500 });
    }
}
