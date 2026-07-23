import { PrismaClient } from '@prisma/client';
import { generateEmployeeId } from './src/utils/helpers';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting employee ID migration...');
  const teachers = await prisma.teacher.findMany();
  
  for (const teacher of teachers) {
    // Generate a unique ID (SVJY-XXXX) that isn't already used
    let newId = generateEmployeeId();
    let isUnique = false;
    
    // Safety check for uniqueness just in case Math.random generates a duplicate
    while (!isUnique) {
      const existing = await prisma.teacher.findUnique({ where: { employeeId: newId } });
      if (existing) {
         newId = generateEmployeeId();
      } else {
         isUnique = true;
      }
    }
    
    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { employeeId: newId }
    });
    console.log(`Updated teacher ${teacher.id} (User ID: ${teacher.userId}) -> ${newId}`);
  }
  
  console.log('Successfully updated all employee IDs.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
