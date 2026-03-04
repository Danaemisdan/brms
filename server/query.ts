import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const p = await prisma.product.findFirst({
    where: { product_name: 'laks' }
  })
  console.log("product_image", p?.product_image)
  console.log("wa_attachment_url", p?.wa_attachment_url)
}
main().finally(() => prisma.$disconnect())
