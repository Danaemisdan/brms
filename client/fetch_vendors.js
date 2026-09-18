const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const vendors = await prisma.user.findMany({
        where: { role: 'VENDOR' },
        select: { id: true, name: true }
    });
    console.log(vendors);
}
main().finally(() => prisma.$disconnect());
