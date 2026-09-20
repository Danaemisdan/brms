import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const email = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        if (!email || !privateKey || !spreadsheetId) {
            return NextResponse.json({ 
                error: "Missing Env Variables", 
                hasEmail: !!email, 
                hasKey: !!privateKey, 
                hasSpreadsheetId: !!spreadsheetId 
            }, { status: 500 });
        }

        let pKey = privateKey;
        if (pKey.startsWith('"') && pKey.endsWith('"')) {
            pKey = pKey.slice(1, -1);
        }
        
        const beginTag = '-----BEGIN PRIVATE KEY-----';
        const endTag = '-----END PRIVATE KEY-----';
        if (pKey.includes(beginTag) && pKey.includes(endTag)) {
            let body = pKey.substring(pKey.indexOf(beginTag) + beginTag.length, pKey.indexOf(endTag));
            body = body.replace(/\\n/g, '').replace(/\s+/g, '');
            const chunks = body.match(/.{1,64}/g) || [];
            pKey = `${beginTag}\n${chunks.join('\n')}\n${endTag}\n`;
        } else {
            pKey = pKey.replace(/\\n/g, '\n');
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: email,
                private_key: pKey,
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Attempt to fetch the spreadsheet info
        const res = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId,
        });

        const sheetNames = res.data.sheets?.map(s => s.properties?.title) || [];

        return NextResponse.json({ 
            success: true, 
            title: res.data.properties?.title,
            sheets: sheetNames
        });

    } catch (error: any) {
        return NextResponse.json({ 
            error: "Google Sheets Error", 
            message: error.message,
            stack: error.stack,
            details: error.response?.data
        }, { status: 500 });
    }
}
