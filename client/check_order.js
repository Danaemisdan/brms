const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const order = await prisma.order.findFirst({
        where: { order_id: 'LAVADKEBALL' }
    });
    console.log("Found order:", order ? order.id : "Not found");
    if (order) {
        console.log("Screenshot URL length:", order.screenshot_url?.length);
        console.log("Screenshot starts with:", order.screenshot_url?.substring(0, 50));
    }
}
run().finally(() => prisma.$disconnect());
