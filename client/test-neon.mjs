import { neon } from '@neondatabase/serverless';
const sql = neon("postgresql://neondb_owner:npg_NRgIGtqV7vH2@ep-bitter-tooth-avisyr7v-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require");
async function main() {
    try {
        const users = await sql`SELECT id, name FROM "User" WHERE role = 'VENDOR'`;
        console.log("Users:", users);
        const vendors = await sql`SELECT * FROM "Vendor"`;
        console.log("Vendors:", vendors);
    } catch(err) {
        console.error(err);
    }
}
main();
