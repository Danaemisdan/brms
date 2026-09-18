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
 * Sync a Product to Google Sheets
 */
export async function syncProductToSheet(productId: string) {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return;

    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return;

        const rowData = [
            product.id,
            product.product_name,
            product.brand,
            product.status,
            product.platform,
            product.real_price?.toString() || "0",
            `${product.filled_slots}/${product.total_slots}`,
            product.deadline.toISOString(),
            new Date().toISOString()
        ];

        // Ensure findRowById exists or change to findRowByOrderId
        // Wait, old findRowById used column A, but we use findRowByOrderId now. Let's make a generic one.
        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `Products!A:A` });
        const rows = res.data.values || [];
        let rowIndex = null;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === product.id) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Products!A${rowIndex}:I${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowData] }
            });
        } else {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Products!A:I',
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
            user.id,
            user.name,
            user.mobile,
            user.email || "",
            user.vendor.status,
            user.vendor.wallet_balance.toString(),
            user.vendor.commission?.toString() || "0"
        ];

        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `Brands!A:A` });
        const rows = res.data.values || [];
        let rowIndex = null;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === user.id) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Brands!A${rowIndex}:G${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowData] }
            });
        } else {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Brands!A:G',
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

        // 3. Pull Products
        const productsRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Products!A2:I' });
        const productRows = productsRes.data.values || [];
        for (const row of productRows) {
            const dbId = row[0];
            const productName = row[1];
            const brand = row[2];
            const status = row[3];
            const platform = row[4];
            const realPrice = parseFloat(row[5]) || 0;

            if (dbId) {
                await prisma.product.updateMany({
                    where: { id: dbId },
                    data: {
                        product_name: productName,
                        brand: brand,
                        status: status || 'DRAFT',
                        platform: platform || 'AMAZON',
                        real_price: realPrice
                    }
                });
            }
        }

        // 4. Pull Brands (Vendors)
        const brandsRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Brands!A2:G' });
        const brandRows = brandsRes.data.values || [];
        for (const row of brandRows) {
            const dbId = row[0]; // This is user.id
            const status = row[4];
            const walletBalance = parseFloat(row[5]) || 0;
            const commission = parseFloat(row[6]) || 0;

            if (dbId) {
                await prisma.vendor.updateMany({
                    where: { user_id: dbId },
                    data: {
                        status: status || 'active',
                        wallet_balance: walletBalance,
                        commission: commission
                    }
                });
            }
        }

        console.log('[Google Sheets] Two-way sync pull completed successfully.');
    } catch (error) {
        console.error('[Google Sheets] Error pulling updates:', error);
    }
}
