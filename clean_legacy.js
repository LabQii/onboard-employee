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
  console.log('Deleted legacy items:', result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
