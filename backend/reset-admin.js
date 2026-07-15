const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
  const newPassword = 'Admin@123';
  const hashed = await bcrypt.hash(newPassword, 12);
  
  const updated = await p.user.update({
    where: { email: 'admin@rajacademy.com' },
    data: { password: hashed },
    select: { email: true, name: true, role: true }
  });
  
  console.log('Password reset for:', updated);
  console.log('New password:', newPassword);
  await p.$disconnect();
}

main().catch(console.error);
