const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!admin) throw new Error("No admin");

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ userId: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET || '274a4726a1373689ab53d1ff680ff4c00a027988db0c112c28372a2e201ed244');

        const FormData = require('form-data');
        const form = new FormData();

        // create a dummy file
        fs.writeFileSync('dummy.png', 'fake image content');
        form.append('images', fs.createReadStream('dummy.png'));

        const res = await fetch('http://localhost:5001/api/upload/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        });

        const text = await res.text();
        console.log("Upload Response:", res.status, text);
    } catch (e) {
        console.error(e);
    }
}
testUpload();
