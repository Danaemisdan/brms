import { PrismaClient } from '@prisma/client';
import { syncOrderToSheet, syncProductToSheet, syncBrandToSheet, initializeSpreadsheet } from '../services/googleSheets.service';

const prisma = new PrismaClient();

// Attempt to initialize the spreadsheet tabs when the server starts
setTimeout(() => {
    initializeSpreadsheet().catch(e => console.error("Spreadsheet init error:", e));
}, 5000);

prisma.$use(async (params, next) => {
    const result = await next(params);
    
    // Non-blocking sync to Google Sheets
    setTimeout(() => {
        try {
            if (params.model === 'Order' && (params.action === 'create' || params.action === 'update')) {
                if (result && result.id) syncOrderToSheet(result.id);
            } else if (params.model === 'Product' && (params.action === 'create' || params.action === 'update')) {
                if (result && result.id) syncProductToSheet(result.id);
            } else if (params.model === 'Vendor' && (params.action === 'create' || params.action === 'update')) {
                if (result && result.user_id) syncBrandToSheet(result.user_id);
            } else if (params.model === 'User' && (params.action === 'create' || params.action === 'update')) {
                if (result && result.role === 'VENDOR' && result.id) {
                    syncBrandToSheet(result.id);
                }
            }
        } catch (e) {
            console.error('[Google Sheets Sync Error]', e);
        }
    }, 0);

    return result;
});

export default prisma;
