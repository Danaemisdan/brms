require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });
  console.log("Product Status Counts:");
  console.log(products);
}

main().finally(() => prisma.$disconnect());
