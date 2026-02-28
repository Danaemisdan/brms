import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const password_hash = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
        where: { mobile: "9999999999" },
        update: {
            password_hash,
            role: "ADMIN",
            name: "Super Admin"
        },
        create: {
            mobile: "9999999999",
            password_hash,
            role: "ADMIN",
            name: "Super Admin"
        }
    });

    console.log("Admin account ensured: mobile='9999999999', password='admin123'", admin.id);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
