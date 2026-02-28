const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const client = await prisma.client.findFirst();
        if(!client) { console.log('No client found'); return; }
        
        const payload = {
            client_id: client.id,
            brand: "Test",
            product_name: "Test Bug",
            product_link: "https://amazon.com",
            platform: "AMAZON",
            refund_amount: 100,
            total_slots: 10,
            daily_limit: 100,
            deadline: new Date(),
            instructions: "test",
            is_public: true,
            status: "ACTIVE"
        };
        
        const product = await prisma.product.create({ data: payload });
        console.log("SUCCESS:", product.id);
    } catch(e) {
        console.log("PRISMA ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
