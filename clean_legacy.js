const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.checklist_items.deleteMany({
    where: {
      OR: [
        { description: null },
        { description: { not: { startsWith: 'http' } } }
      ]
    }
  });
  
}
main().catch(console.error).finally(() => prisma.$disconnect());
