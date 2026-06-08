import { Router, Request, Response } from 'express';
import prisma from '../../config/database';

const router = Router();

// POST /api/webhooks/sheets
router.post('/sheets', async (req: Request, res: Response) => {
    try {
        const { sheetName, rowData, rowIndex } = req.body;

        if (!sheetName || !rowData || !rowIndex) {
            res.status(400).json({ error: 'Missing required payload data' });
            return;
        }

        const dbId = rowData[0]; // First column is DB_ID
        if (!dbId || dbId === 'DB_ID') {
            res.status(400).json({ error: 'Invalid DB_ID' });
            return;
        }

        if (sheetName === 'Orders') {
            const status = rowData[6]; // G
            const remarks = rowData[9]; // J
            await prisma.order.update({
                where: { id: dbId },
                data: { status, remarks }
            });
        } else if (sheetName === 'Products') {
            const productName = rowData[1]; // B
            const status = rowData[3]; // D
            const realPrice = parseFloat(rowData[5]); // F
            
            const updateData: any = { product_name: productName, status };
            if (!isNaN(realPrice)) updateData.real_price = realPrice;
            
            await prisma.product.update({
                where: { id: dbId },
                data: updateData
            });
        } else if (sheetName === 'Brands') {
            const brandName = rowData[1]; // B
            const status = rowData[4]; // E
            const commission = parseFloat(rowData[6]); // G
            
            await prisma.user.update({
                where: { id: dbId },
                data: { name: brandName }
            });
            
            const vendorUpdate: any = { status };
            if (!isNaN(commission)) vendorUpdate.commission = commission;

            await prisma.vendor.update({
                where: { user_id: dbId },
                data: vendorUpdate
            });
        } else {
            res.status(400).json({ error: 'Unknown sheet name' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('[Webhooks] Sheets Sync Error:', error);
        res.status(500).json({ error: 'Sync failed' });
    }
});

export default router;
