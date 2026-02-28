import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // We need a dummy client first because Product requires a client_id
    // Upsert User with CLIENT role
    const user = await prisma.user.upsert({
        where: { mobile: "1111111111" },
        update: {},
        create: {
            mobile: "1111111111",
            role: "CLIENT",
            name: "Test Client"
        }
    });

    // Upsert the Client profile
    const client = await prisma.client.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
            user_id: user.id,
            company_name: "Test Brand Inc."
        }
    });

    const product = await prisma.product.create({
        data: {
            client_id: client.id,
            brand: "Test Brand Inc.",
            product_name: "Premium Mixer Grinder 750W",
            product_image: "https://m.media-amazon.com/images/I/61Nl-HhGvPL._SX679_.jpg", // Real dummy image
            product_link: "https://amazon.in/dp/B000000000?tag=dummy-affiliate", // Affiliate link
            platform: "AMAZON",
            refund_amount: 1500,
            total_slots: 100,
            daily_limit: 10,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            instructions: "1. Click the link and search for 'Mixer Grinder'.\n2. Buy the product that matches the image.\n3. Upload your order ID here.",
            status: "ACTIVE"
        }
    });

    console.log("Created active campaign:", product.id);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
