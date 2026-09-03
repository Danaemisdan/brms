import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { sheetName, rowData, rowIndex } = body;

        if (!sheetName || !rowData || !rowIndex) {
            return NextResponse.json({ error: 'Missing required payload data' }, { status: 400 });
        }

        const dbId = rowData[0];
        if (!dbId || dbId === 'DB_ID') {
            return NextResponse.json({ error: 'Invalid DB_ID' }, { status: 400 });
        }

        if (sheetName === 'Orders') {
            const status = rowData[6];
            const remarks = rowData[9];
            await prisma.order.update({
                where: { id: dbId },
                data: { status, remarks }
            });
        } else if (sheetName === 'Products') {
            const productName = rowData[1];
            const status = rowData[3];
            const realPrice = parseFloat(rowData[5]);
            
            const updateData: any = { product_name: productName, status };
            if (!isNaN(realPrice)) updateData.real_price = realPrice;
            
            await prisma.product.update({
                where: { id: dbId },
                data: updateData
            });
        } else if (sheetName === 'Brands') {
            const brandName = rowData[1];
            const status = rowData[4];
            const commission = parseFloat(rowData[6]);
            
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
            return NextResponse.json({ error: 'Unknown sheet name' }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('[Webhooks] Sheets Sync Error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
