import { PrismaClient } from "@prisma/client";

function dedupe(values: string[]): string[] {
    return [...new Set(values.map(v => v.trim()).filter(Boolean))];
}

export async function resolveRecipients(
    prisma: PrismaClient,
    target: string,
    customPhones: string
): Promise<string[]> {
    if (target === "custom") {
        return dedupe((customPhones || "").split(","));
    }

    if (target === "verified_customers") {
        const users = await prisma.user.findMany({
            where: {
                role: "CUSTOMER",
                refunds: {
                    some: {
                        status: { in: ["PROCESSING", "REFUNDED"] },
                    },
                },
            },
            select: { mobile: true },
        });
        return dedupe(users.map(u => u.mobile));
    }

    const users = await prisma.user.findMany({
        where: { role: "CUSTOMER" },
        select: { mobile: true },
    });
    return dedupe(users.map(u => u.mobile));
}
