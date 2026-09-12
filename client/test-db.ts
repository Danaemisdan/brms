import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const vendors = await prisma.vendor.findMany();
  console.log('Vendors:', vendors);
  const users = await prisma.user.findMany({ where: { role: 'VENDOR' }});
  console.log('Users:', users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
