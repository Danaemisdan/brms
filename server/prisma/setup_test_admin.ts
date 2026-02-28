import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password_hash = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
        where: { mobile: '9000000000' },
        update: { password_hash, role: 'ADMIN' },
        create: {
            mobile: '9000000000',
            password_hash,
            name: 'Test Admin',
            role: 'ADMIN',
            email: 'admin_test@example.com'
        }
    });

    // Also ensure a test customer exists
    await prisma.user.upsert({
        where: { mobile: '8000000000' },
        update: { password_hash, role: 'CUSTOMER' },
        create: {
            mobile: '8000000000',
            password_hash,
            name: 'Test Customer',
            role: 'CUSTOMER',
            email: 'customer_test@example.com'
        }
    });

    console.log("Test users created");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
