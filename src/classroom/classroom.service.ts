import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ClassroomService {
  async create(dto: { name: string }) {
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('Classroom name is required');
    }

    return prisma.classroom.create({
      data: {
        name: dto.name.trim(),
      },
    });
  }

  async findAll() {
    return prisma.classroom.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async disable(id: number) {
    return prisma.classroom.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
