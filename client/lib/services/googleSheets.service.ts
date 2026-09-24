import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import prisma from '@/lib/prisma';

// Global Cache for Spreadsheet ID
let cachedSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const KEY_PATH = path.join(__dirname, '../../../credentials.json');

let sheetsApi: any = null;

function getSheetsClient() {
    if (sheetsApi) return sheetsApi;
    
    try {
        let auth;
        // First try to use Vercel environment variables
        if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
            let pKey = process.env.GOOGLE_PRIVATE_KEY;
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

            auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: process.env.GOOGLE_CLIENT_EMAIL,
                    private_key: pKey,
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } 
        // Fallback to local credentials.json
        else if (fs.existsSync(KEY_PATH)) {
            auth = new google.auth.GoogleAuth({
                keyFile: KEY_PATH,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } 
        else {
            console.warn(`⚠️ [Google Sheets] No credentials found in ENV or at ${KEY_PATH}. Sync disabled.`);
            return null;
        }

        sheetsApi = google.sheets({ version: 'v4', auth });
        return sheetsApi;
    } catch (error) {
        console.error('Error initializing Google Sheets client:', error);
        return null;
    }
}

function getSpreadsheetId(): string | null {
    if (cachedSpreadsheetId) return cachedSpreadsheetId;
    if (process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
        cachedSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        return cachedSpreadsheetId;
    }
    return null;
}

export async function initializeSpreadsheet() {
    // We are no longer auto-creating tabs since the user has existing tabs.
    // Q2 General Order and Q2 General refund are pre-existing.
    return;
}

/**
 * Finds the row index (1-based) by Order ID in a specific column.
 */
export async function findRowByOrderId(sheetName: string, orderId: string, colRange: string): Promise<number | null> {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return null;

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!${colRange}`,
        });
        const rows = res.data.values;
        if (!rows || rows.length === 0) return null;
        
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === orderId) {
                return i + 1; // Google Sheets uses 1-based index
            }
        }
        return null;
    } catch (error) {
        console.error(`[Google Sheets] Error finding row by Order ID in ${sheetName}:`, error);
        return null;
    }
}

/**
 * Sync an Order to "Q2 General Order"
 */
export async function syncOrderToSheet(internalId: string) {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return;

    try {
        const order = await prisma.order.findUnique({
            where: { id: internalId },
            include: { user: true, product: true, review: true, refund: true }
        });
        if (!order) return;

        const safeText = (val: any, fieldName: string = '') => {
            if (!val) return "";
            const s = String(val);
            if (s.startsWith("data:image/") || s.length > 1000) {
                if (fieldName) return `https://samplelelo.in/api/image/order/${order.id}?field=${fieldName}`;
                return "[Base64 Image / Large Data]";
            }
            return s;
        };

        const rowData = [
            order.created_at.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }), // A: Timestamp
            safeText(order.profile_name || order.user.name), // B: Profile Name
            safeText(order.product.deal_type), // C: Code
            safeText(order.product.product_name), // D: Product Name
            safeText(order.order_id), // E: Order ID / Order Number
            safeText(order.screenshot_url, 'screenshot_url'), // F: UPLOAD SCREENHOT
            order.amount.toString(), // G: Total Order Price
            "", // H: After Less
            "", // I: QR
            safeText(order.reference_name), // J: Reference Name
            "", // K: Less
            safeText(order.user.mobile), // L: Number
            safeText(order.user.email), // M: Email Address
            "", // N: Follow Us
            "", // O: Counter
            order.refund ? order.refund.amount.toString() : "", // P: Refund Released
            "", // Q: Substitute Order id's
            safeText(order.review ? order.review.review_url : ""), // R: Review link
            order.review ? order.review.rating.toString() : "", // S: Review / Rating?
            safeText(order.review ? order.review.screenshot_url : "", 'review_screenshot'), // T: Review ss
            safeText(order.return_window_screenshot_url, 'return_window_screenshot'), // U: Return Window ss
            safeText(order.status), // V: System Status (appended)
            safeText(order.remarks), // W: System Remarks (appended)
        ];

        // Search Order ID in Column E
        const rowIndex = await findRowByOrderId('Q2 General Order', order.order_id, 'E:E');

        if (rowIndex) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'Q2 General Order'!A${rowIndex}:W${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowData] }
            });
        } else {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `'Q2 General Order'!A:W`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: [rowData] }
            });
        }
    } catch (error) {
        console.error(`[Google Sheets] Error syncing order ${internalId}:`, error);
        throw error; // Throw so we can see it in debug
    }
}

/**
 * Sync a Refund to "Q2 General refund"
 */
export async function syncRefundToSheet(internalId: string) {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return;

    try {
        const order = await prisma.order.findUnique({
            where: { id: internalId },
            include: { user: true, product: true, review: true, refund: true }
        });
        if (!order) return;

        const safeText = (val: any, fieldName: string = '') => {
            if (!val) return "";
            const s = String(val);
            if (s.startsWith("data:image/") || s.length > 1000) {
                if (fieldName) return `https://samplelelo.in/api/image/order/${order.id}?field=${fieldName}`;
                return "[Base64 Image / Large Data]";
            }
            return s;
        };

        const rowData = [
            (order.refund?.created_at || new Date()).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }), // A: Timestamp
            safeText(order.profile_name || order.user.name), // B: Profile Name
            safeText(order.product.product_name), // C: Product Name
            safeText(order.order_id), // D: Order Id
            order.refund ? order.refund.amount.toString() : "", // E: Refund Release Amount
            safeText(order.user.name), // F: Refund Profile Name
            "", // G: Customer Issue
            safeText(order.user.mobile), // H: Contact no
            "", // I: Qr Scan
            safeText(order.screenshot_url, 'screenshot_url'), // J: screenshot
            safeText(order.review ? order.review.screenshot_url : "", 'review_screenshot'), // K: Review ss
            "", // L: UPI (Often missing in DB refund schema, handle carefully)
            "", // M: Account no
            "", // N: IFSC
            "", // O: Status (Often updated manually in Sheets)
            safeText(order.status), // P: System Status
            safeText(order.remarks)  // Q: System Remarks
        ];

        // Search Order ID in Column D
        const rowIndex = await findRowByOrderId('Q2 General refund', order.order_id, 'D:D');

        if (rowIndex) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'Q2 General refund'!A${rowIndex}:Q${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowData] }
            });
        } else {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `'Q2 General refund'!A:H`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: [rowData] }
            });
        }
    } catch (error) {
        console.error(`[Google Sheets] Failed to sync refund ${internalId}:`, error);
    }
}

/**
 * Sync a Product to Google Sheets (Matrix)
 */
export async function syncProductToSheet(productId: string) {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return;

    try {
        const product = await prisma.product.findUnique({ 
            where: { id: productId },
            include: { client: { include: { user: true } } }
        });
        if (!product) return;

        const rowData = [
            "", // A: Sr No.
            product.brand || "", // B: Brand
            product.product_name || "", // C: Product Name
            product.client?.user?.name || "", // D: Client Name
            "", // E: Client code
            product.product_link || "", // F: Product Link
            product.total_slots?.toString() || "0", // G: Slot
            product.real_price?.toString() || "0", // H: Cost
            product.filled_slots?.toString() || "0", // I: Placed
            "", // J: Pending
            product.status || "DRAFT", // K: Status
            "", // L: Refund Placed
            "", // M: Pending Refund
            product.deadline ? product.deadline.toISOString() : "", // N: Order End Date
            "" // O: Refund End date
        ];

        // Find by Product Name in Column C
        const rowIndex = await findRowByOrderId('Matrix', product.product_name, 'C:C');

        if (rowIndex) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'Matrix'!A${rowIndex}:O${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowData] }
            });
        } else {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `'Matrix'!A:O`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: [rowData] }
            });
        }
    } catch (error) {
        console.error(`[Google Sheets] Failed to sync product ${productId}:`, error);
    }
}

/**
 * Sync a Brand to Google Sheets (Matrix)
 */
export async function syncBrandToSheet(vendorUserId: string) {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return;

    try {
        const user = await prisma.user.findUnique({
            where: { id: vendorUserId },
            include: { vendor: true }
        });
        if (!user || user.role !== 'VENDOR' || !user.vendor) return;

        const rowData = [
            "", // A: Sr No.
            user.name, // B: Brand (using user.name as brand name based on frontend mapping)
            "", // C: Product Name
            user.name, // D: Client Name
            "", // E: Client code
            "", // F: Product Link
            "0", // G: Slot
            "0", // H: Cost
            "0", // I: Placed
            "", // J: Pending
            user.vendor.status || "active", // K: Status
            "", // L: Refund Placed
            "", // M: Pending Refund
            "", // N: Order End Date
            "" // O: Refund End date
        ];

        // Ensure findRowById exists or change to findRowByOrderId
        const rowIndex = await findRowByOrderId('Matrix', user.name, 'B:B');

        if (rowIndex) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'Matrix'!A${rowIndex}:O${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowData] }
            });
        } else {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `'Matrix'!A:O`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: [rowData] }
            });
        }
    } catch (error) {
        console.error(`[Google Sheets] Failed to sync brand ${vendorUserId}:`, error);
    }
}

/**
 * Sync a Dynamic Custom Record to Google Sheets
 */
export async function syncCustomRecordToSheet(form: any, record: any) {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return;

    try {
        const fields = form.fields as Array<{ name: string; type: string; column: string }>;
        if (!fields || !Array.isArray(fields) || fields.length === 0) return;

        // Convert column letters (A, B, C...) to zero-based index (0, 1, 2...)
        const colToIndex = (col: string) => {
            let index = 0;
            for (let i = 0; i < col.length; i++) {
                index = index * 26 + col.charCodeAt(i) - 64;
            }
            return index - 1;
        };

        const safeText = (val: any, fieldName: string = '') => {
            if (val == null) return "";
            const s = String(val);
            if (s.startsWith("data:image/") || s.length > 1000) {
                if (fieldName) return `https://samplelelo.in/api/image/custom/${record.id}?field=${encodeURIComponent(fieldName)}`;
                return "[Base64 Image / Large Data]";
            }
            return s;
        };

        const maxIndex = Math.max(...fields.map(f => colToIndex(f.column.toUpperCase())));
        const rowData = new Array(maxIndex + 1).fill("");

        // Fill array based on column mapping
        for (const field of fields) {
            const idx = colToIndex(field.column.toUpperCase());
            const value = (record.data as any)[field.name];
            
            if (field.type === 'image') {
                rowData[idx] = safeText(value, field.name);
            } else {
                rowData[idx] = safeText(value);
            }
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${form.sheet_name}'!A:ZZ`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [rowData] }
        });
    } catch (error) {
        console.error(`[Google Sheets] Failed to sync custom record ${record.id}:`, error);
    }
}

/**
 * Append a generic row to a Google Sheet
 */
export async function appendRowToSheet(sheetName: string, rowData: any[]) {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return;

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${sheetName}'!A:ZZ`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [rowData] }
        });
    } catch (error) {
        console.error(`[Google Sheets] Failed to append row to ${sheetName}:`, error);
        throw error;
    }
}

/**
 * Pull updates from Google Sheets into the Database
 */
export async function pullUpdatesFromSheet() {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return;

    try {
        console.log('[Google Sheets] Starting two-way sync pull...');

        // 1. Pull Orders from Q2 General Order
        const ordersRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'Q2 General Order'!A2:W` });
        const orderRows = ordersRes.data.values || [];
        for (const row of orderRows) {
            const orderId = row[4]; // Column E: Order ID
            const status = row[21]; // Column V: System Status
            const remarks = row[22]; // Column W: System Remarks
            
            if (orderId && status) {
                await prisma.order.updateMany({
                    where: { order_id: orderId },
                    data: {
                        status: status,
                        remarks: remarks || null
                    }
                });
            }
        }

        // 2. Pull Refunds from Q2 General refund
        const refundsRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'Q2 General refund'!A2:H` });
        const refundRows = refundsRes.data.values || [];
        for (const row of refundRows) {
            const orderId = row[3]; // Column D: Order ID
            const refundStatus = row[7]; // Column H: System Refund Status
            
            if (orderId && refundStatus) {
                const order = await prisma.order.findUnique({ where: { order_id: orderId }, select: { id: true } });
                if (order) {
                    await prisma.refund.updateMany({
                        where: { order_id: order.id },
                        data: {
                            status: refundStatus
                        }
                    });
                }
            }
        }

        // 3. Pull Products from Matrix
        const matrixRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'Matrix'!A2:O` });
        const matrixRows = matrixRes.data.values || [];
        for (const row of matrixRows) {
            const brand = row[1]; // B: Brand
            const productName = row[2]; // C: Product Name
            const productLink = row[5]; // F: Product Link
            const slots = parseInt(row[6]) || 0; // G: Slot
            const cost = parseFloat(row[7]) || 0; // H: Cost
            const status = row[10]; // K: Status

            // Upsert Brand (Vendor) if it doesn't exist so it appears on the frontend
            if (brand) {
                const existingBrand = await prisma.user.findFirst({
                    where: { name: brand, role: 'VENDOR' }
                });

                if (!existingBrand) {
                    const newBrandUser = await prisma.user.create({
                        data: {
                            name: brand,
                            mobile: "0000000000", // Placeholder until updated in frontend
                            password_hash: "matrix_imported_placeholder",
                            role: 'VENDOR'
                        }
                    });
                    await prisma.vendor.create({
                        data: {
                            user_id: newBrandUser.id,
                            wallet_balance: 0,
                            commission: 0,
                        }
                    });
                }
            }

            if (productName) {
                await prisma.product.updateMany({
                    where: { product_name: productName },
                    data: {
                        brand: brand || undefined,
                        product_link: productLink || undefined,
                        total_slots: slots || undefined,
                        real_price: cost || undefined,
                        status: status || undefined
                    }
                });
            }
        }

        console.log('[Google Sheets] Two-way sync pull completed successfully.');
    } catch (error) {
        console.error('[Google Sheets] Error pulling updates:', error);
    }
}
