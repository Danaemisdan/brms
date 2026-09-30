import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_POSTGRES_URL_NON_POOLING,
});

async function main() {
  const hashedPassword = await bcrypt.hash('Sanjeev@2026!Strong', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@brms.app' },
    update: {},
    create: {
      email: 'admin@brms.app',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      email_verified: true,
      wallet_balance: 0,
      verification_status: 'VERIFIED'
    },
  });

  console.log('Admin user seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
