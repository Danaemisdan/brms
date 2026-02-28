const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) return console.log("No admin found");

    const token = jwt.sign(
        { id: admin.id, role: admin.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
    );

    const payload = {
        client_id: "5d0b58cf-aa25-4088-8032-4dbd913a4be4",
        brand: "Admin Added Brand",
        product_name: "Test Bug",
        product_link: "https://amazon.com",
        platform: "AMAZON",
        refund_amount: 100,
        total_slots: 10,
        daily_limit: 100,
        deadline: new Date().toISOString(),
        instructions: "test",
        is_public: true,
        product_image: "[]"
    };

    const fetch = require('node-fetch');
    const res = await fetch("http://localhost:5002/api/products", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    const data = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", data);
}
main();
