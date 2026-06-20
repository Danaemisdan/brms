import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { Order, Product, Vendor, User } from '@prisma/client';
import prisma from '../config/database';

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

/**
 * Ensures the basic tabs exist in the spreadsheet
 */
export async function initializeSpreadsheet() {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return;

    try {
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const existingTabs = spreadsheet.data.sheets.map((s: any) => s.properties.title);

        const requiredTabs = ['Orders', 'Products', 'Brands'];
        const requests: any[] = [];

        for (const tab of requiredTabs) {
            if (!existingTabs.includes(tab)) {
                requests.push({
                    addSheet: {
                        properties: {
                            title: tab,
                        }
                    }
                });
            }
        }

        if (requests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests }
            });
            console.log(`[Google Sheets] Created missing tabs: ${requiredTabs.filter(t => !existingTabs.includes(t)).join(', ')}`);
            
            // Add headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Orders!A1:N1',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [['DB_ID', 'Order ID', 'Customer Name', 'Customer Mobile', 'Product Name', 'Brand', 'Status', 'Order Amount', 'Refund Amount', 'Remarks', 'Order Date', 'Delivery Date', 'Target Deal Type', 'Last Updated']]
                }
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Products!A1:I1',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [['DB_ID', 'Product Name', 'Brand', 'Status', 'Platform', 'Real Price', 'Filled/Total', 'Deadline', 'Last Updated']]
                }
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Brands!A1:G1',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [['DB_ID', 'Brand Name', 'Mobile', 'Email', 'Status', 'Wallet Balance', 'Commission (%)']]
                }
            });
        }
    } catch (error) {
        console.error('[Google Sheets] Error initializing spreadsheet:', error);
    }
}

export async function findRowById(sheetName: string, id: string): Promise<number | null> {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return null;

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:A`,
        });
        const rows = res.data.values;
        if (!rows || rows.length === 0) return null;
        
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === id) {
                return i + 1; // Google Sheets uses 1-based index
            }
        }
        return null;
    } catch (error) {
        console.error(`[Google Sheets] Error finding row by ID in ${sheetName}:`, error);
        return null;
    }
}

/**
 * Sync an Order to Google Sheets
 */
export async function syncOrderToSheet(orderId: string) {
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    if (!sheets || !spreadsheetId) return;

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true, product: true }
        });
        if (!order) return;

        const rowData = [
            order.id, // A: DB_ID
            order.order_id, // B: Order ID
            order.user.name, // C: Customer Name
            order.user.mobile, // D: Customer Mobile
            order.product.product_name, // E: Product Name
            order.product.brand, // F: Brand
            order.status, // G: Status
            order.amount.toString(), // H: Order Amount
            order.product.refund_amount?.toString() || order.amount.toString(), // I: Refund Amount
            order.remarks || "", // J: Remarks
            order.order_date.toISOString(), // K: Order Date
            order.delivery_date?.toISOString() || "", // L: Delivery Date
            order.product.deal_type || "", // M: Target Deal Type
            new Date().toISOString() // N: Last Updated
        ];

        const rowIndex = await findRowById('Orders', order.id);

        if (rowIndex) {
            // Update existing row
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Orders!A${rowIndex}:N${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowData] }
            });
        } else {
            // Append new row
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Orders!A:N',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: [rowData] }
            });
        }
    } catch (error) {
        console.error(`[Google Sheets] Failed to sync order ${orderId}:`, error);
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

        const rowIndex = await findRowById('Products', product.id);

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

        const rowIndex = await findRowById('Brands', user.id);

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

        // 1. Pull Orders
        const ordersRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Orders!A2:N' });
        const orderRows = ordersRes.data.values || [];
        for (const row of orderRows) {
            const dbId = row[0];
            const status = row[6];
            const remarks = row[9];
            if (dbId) {
                // Update Order in DB
                await prisma.order.updateMany({
                    where: { id: dbId },
                    data: {
                        status: status || 'SUBMITTED',
                        remarks: remarks || null
                    }
                });
            }
        }

        // 2. Pull Products
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

        // 3. Pull Brands (Vendors)
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
