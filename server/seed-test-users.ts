import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const adminPass = await bcrypt.hash("admin123", 10);
    const clientPass = await bcrypt.hash("client123", 10);
    const userPass = await bcrypt.hash("user123", 10);

    // Update Admin
    await prisma.user.upsert({
        where: { mobile: "9999999999" },
        update: { password_hash: adminPass, role: "ADMIN", name: "Super Admin" },
        create: { mobile: "9999999999", password_hash: adminPass, role: "ADMIN", name: "Super Admin" }
    });

    // Update Client
    const clientUser = await prisma.user.upsert({
        where: { mobile: "1111111111" },
        update: { password_hash: clientPass, role: "CLIENT", name: "Test Brand" },
        create: { mobile: "1111111111", password_hash: clientPass, role: "CLIENT", name: "Test Brand" }
    });
    await prisma.client.upsert({
        where: { user_id: clientUser.id },
        update: { company_name: "Test Brand Inc." },
        create: { user_id: clientUser.id, company_name: "Test Brand Inc." }
    });

    // Create Customer
    await prisma.user.upsert({
        where: { mobile: "2222222222" },
        update: { password_hash: userPass, role: "CUSTOMER", name: "Test Customer" },
        create: { mobile: "2222222222", password_hash: userPass, role: "CUSTOMER", name: "Test Customer" }
    });

    console.log("Test users seeded!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
