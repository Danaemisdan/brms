import { NextRequest, NextResponse } from 'next/server';
import { pullUpdatesFromSheet } from '@/lib/services/googleSheets.service';
import { requireRole } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const session = requireRole(req, ['ADMIN']);
    if (session instanceof NextResponse) return session;

    try {
        await pullUpdatesFromSheet();
        return NextResponse.json({ success: true, message: "Successfully synced with Google Sheets." }, { status: 200 });
    } catch (error) {
        console.error("Force sync failed:", error);
        return NextResponse.json({ success: false, message: "Failed to sync with Google Sheets." }, { status: 500 });
    }
}
