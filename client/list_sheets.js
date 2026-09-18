const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function main() {
    const KEY_PATH = path.join(__dirname, '../credentials.json');
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1Jwlqv5riX4ahJqRoMc-5RCHSppuFk13Fs4xEu6gG8Ak';

    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        const res = await sheets.spreadsheets.get({
            spreadsheetId
        });
        const sheetTitles = res.data.sheets.map(s => s.properties.title);
        console.log(JSON.stringify(sheetTitles, null, 2));
    } catch (e) {
        console.error(e);
    }
}
main();
