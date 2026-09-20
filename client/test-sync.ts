import { PrismaClient } from '@prisma/client';
import { syncOrderToSheet } from './lib/services/googleSheets.service';
const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findFirst({
        orderBy: { created_at: 'desc' }
    });
    if (!order) {
        console.log("No orders found");
        return;
    }
    console.log("Syncing order:", order.id, order.order_id);
    await syncOrderToSheet(order.id);
    console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());
