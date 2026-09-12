import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { role: 'VENDOR' }, include: { vendor: true } });
  console.log("Users:", JSON.stringify(users, null, 2));

  for (const user of users) {
    if (user.name === 'MedHub') {
      if (!user.vendor) {
         console.log("MEDHUB HAS NO VENDOR RECORD!");
         await prisma.vendor.create({
            data: {
               user_id: user.id,
               wallet_balance: 50000,
               commission: 10
            }
         });
         console.log("Created vendor record for MedHub!");
      } else {
         console.log("MEDHUB VENDOR RECORD EXISTS:", user.vendor);
         await prisma.vendor.update({
            where: { user_id: user.id },
            data: { wallet_balance: user.vendor.wallet_balance + 50000 }
         });
         console.log("Updated MedHub wallet balance!");
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
