const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    select: { email: true, name: true, role: true, isActive: true }
  });
  console.log(JSON.stringify(users, null, 2));
  await p.$disconnect();
}

main().catch(console.error);
