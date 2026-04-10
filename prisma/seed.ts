import { PrismaClient, Role, Gender } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  await prisma.employee.createMany({
    data: [
      {
        name: 'Admin User',
        email: 'admin@college.edu',
        password,
        role: Role.ADMIN,
        gender: Gender.MALE,
      },
      {
        name: 'Manager User',
        email: 'manager@college.edu',
        password,
        role: Role.MANAGER,
        gender: Gender.FEMALE,
      },
      {
        name: 'Staff User',
        email: 'staff@college.edu',
        password,
        role: Role.STAFF,
        gender: Gender.MALE,
      },
      {
        name: 'Staff User1',
        email: 'staff1@college.edu',
        password,
        role: Role.STAFF,
        gender: Gender.MALE,
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
