import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.findFirst({where: {role: 'ADMIN'}});
    
    let clientId = null;
    let client = await prisma.client.findFirst();
    if (!client && admin) {
        client = await prisma.client.create({ data: { user_id: admin.id, company_name: 'Test' }});
    }
    if (client) clientId = client.id;

    console.log("Triggering DB Create with Client:", clientId);

    const product = await prisma.product.create({
      data: {
          client_id: clientId || "dummy",
          brand: "Test",
          product_name: "Test",
          product_image: "img",
          product_link: "link",
          platform: "AMAZON",
          refund_amount: 10,
          total_slots: 10,
          daily_limit: 10,
          deadline: new Date(),
          instructions: "Test",
          is_public: true,
          status: "ACTIVE"
      }
    });
    console.log("Success:", product.id);
  } catch (e: any) {
    console.error("🔴 PRISMA ERROR 🔴");
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
