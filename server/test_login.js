const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'brms_secret_dev_key_change_in_prod_at_least_32_chars';

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!user) {
    console.log("No admin found");
    return;
  }
  
  // Overwrite password for testing
  const password_hash = await bcrypt.hash('password123', 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash }
  });
  
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  console.log("TOKEN=" + token);
}
main().catch(console.error).finally(() => prisma.$disconnect());
