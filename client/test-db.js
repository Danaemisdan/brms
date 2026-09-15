const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({ take: 1 });
  console.log("Orders found:", orders.length);
  if (orders.length > 0) {
    console.log("Order ID:", orders[0].id);
    console.log("Order String ID:", orders[0].order_id);
    
    // Try to update it
    try {
      const updated = await prisma.order.update({
        where: { id: orders[0].id },
        data: { status: 'VALIDATED' }
      });
      console.log("Update success:", updated.status);
    } catch(e) {
      console.error("Update failed:", e);
    }
  }
}
main();
