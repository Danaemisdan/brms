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
        if (!fs.existsSync(KEY_PATH)) {
            console.warn(`⚠️ [Google Sheets] credentials.json not found at ${KEY_PATH}. Sync disabled.`);
            return null;
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

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
            range: `${sheetName}!${colRange}`,
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

        const rowData = [
            order.created_at.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }), // A: Timestamp
            order.profile_name || order.user.name, // B: Profile Name
            order.product.deal_type || "", // C: Code
            order.product.product_name, // D: Product Name
            order.order_id, // E: Order ID / Order Number
            order.screenshot_url, // F: UPLOAD SCREENHOT
            order.amount.toString(), // G: Total Order Price
            "", // H: After Less
            "", // I: QR
            order.reference_name || "", // J: Reference Name
            "", // K: Less
            order.user.mobile, // L: Number
            order.user.email || "", // M: Email Address
            "", // N: Follow Us
            "", // O: Counter
            order.refund ? order.refund.amount.toString() : "", // P: Refund Released
            "", // Q: Substitute Order id's
            order.review ? order.review.review_url || "" : "", // R: Review link
            order.review ? order.review.rating.toString() : "", // S: Review / Rating?
            order.review ? order.review.screenshot_url || "" : "", // T: Review ss
            order.return_window_screenshot_url || "", // U: Return Window ss
            order.status, // V: System Status (appended)
            order.remarks || "", // W: System Remarks (appended)
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
        console.error(`[Google Sheets] Failed to sync order ${internalId}:`, error);
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

        const rowData = [
            (order.refund?.created_at || new Date()).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }), // A: Timestamp
            order.profile_name || order.user.name, // B: Profile Name
            order.product.product_name, // C: Product Name
            order.order_id, // D: Order ID
            order.review?.screenshot_url || order.screenshot_url, // E: UPLOAD SCREENHOT
            order.amount.toString(), // F: Total Order Price
            order.manager_name || "", // G: Manager Name
            order.refund?.status || "", // H: System Refund Status (appended)
        ];

        // Search Order ID in Column D
        const rowIndex = await findRowByOrderId('Q2 General refund', order.order_id, 'D:D');

        if (rowIndex) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'Q2 General refund'!A${rowIndex}:H${rowIndex}`,
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
 * Sync a Brand to Google Sheets
 * Note: Matrix sheet uses Products as the base row. We don't push standalone brands.
 */
export async function syncBrandToSheet(vendorUserId: string) {
    // No-op for now, as brands/clients are synced as part of their products in the Matrix sheet.
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
