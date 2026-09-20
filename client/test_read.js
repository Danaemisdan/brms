const { google } = require('googleapis');
require('dotenv').config({ path: './.env' }); // or use process.env if set via command line

async function run() {
    try {
        const email = process.env.GOOGLE_CLIENT_EMAIL || "";
        const privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

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
            credentials: { client_email: email, private_key: pKey },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'Q2 General Order'!A:W`,
        });

        const rows = res.data.values;
        if (!rows) {
            console.log("No rows found.");
            return;
        }

        console.log("Total rows:", rows.length);
        let found = false;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][4] && rows[i][4].includes("LAVADKEBALL")) {
                console.log(`Found LAVADKEBALL at row ${i + 1}`);
                console.log(rows[i]);
                found = true;
            }
        }
        if (!found) {
            console.log("LAVADKEBALL not found anywhere in the sheet.");
        }
        
    } catch (e) {
        console.error(e);
    }
}
run();
