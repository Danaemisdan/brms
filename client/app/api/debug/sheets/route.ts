import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { syncOrderToSheet } from '@/lib/services/googleSheets.service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const email = process.env.GOOGLE_CLIENT_EMAIL || "";
        const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        if (!email || !privateKey || !spreadsheetId) {
            return NextResponse.json({ error: "Missing Google Sheets credentials in env variables." }, { status: 500 });
        }

        // Test real sync for LAVADKEBALL
        let realSyncResult = null;
        try {
            const order = await prisma.order.findFirst({
                where: {
                    OR: [
                        { id: 'LAVADKEBALL' },
                        { order_id: 'LAVADKEBALL' }
                    ]
                }
            });
            
            const targetId = order ? order.id : 'LAVADKEBALL';
            await syncOrderToSheet(targetId);
            realSyncResult = `Synced order: ${targetId}`;
        } catch (e: any) {
            realSyncResult = { error: e.message, stack: e.stack };
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: email,
                private_key: pKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Search for where it went
        let searchResult = null;
        try {
            const getRes = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `'Q2 General Order'!A:W`,
            });
            const rows = getRes.data.values || [];
            searchResult = rows.map((r, i) => ({ row: i + 1, orderId: r[4] })).filter(x => x.orderId && x.orderId.includes('LAVADKEBALL'));
        } catch (e: any) {
            searchResult = { error: e.message };
        }

        return NextResponse.json({ 
            success: true, 
            realSyncTest: realSyncResult,
            searchResult
        });

    } catch (error: any) {
        // Also capture what we just parsed
        const email = process.env.GOOGLE_CLIENT_EMAIL || "";
        const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
        
        return NextResponse.json({ 
            error: "Google Sheets Error", 
            message: error.message,
            stack: error.stack,
            diagnostics: {
                originalLength: privateKey.length,
                hasBeginTag: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
                hasEndTag: privateKey.includes('-----END PRIVATE KEY-----'),
                hasLiteralNewlines: privateKey.includes('\\n'),
                startsWithQuote: privateKey.startsWith('"'),
                startsWithBrace: privateKey.startsWith('{'),
            }
        }, { status: 500 });
    }
}
