import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const vendors = await prisma.vendor.findMany({ include: { user: true } });
    console.log("Vendors from DB:", JSON.stringify(vendors, null, 2));
}
main();
