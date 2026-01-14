import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class WorkSubmissionService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createWorkSubmissionDto: Prisma.WorkSubmissionCreateInput) {
    try {
      return await this.databaseService.workSubmission.create({
        data: createWorkSubmissionDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'Referenced record not found. Ensure assignment and staff IDs exist.',
          );
        }
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'A work submission already exists for this assignment.',
          );
        }
      }
      throw error;
    }
  }

  async findAll(staffId?: number, verifiedById?: number, assignmentId?: number) {
    const where: Prisma.WorkSubmissionWhereInput = {};

    if (staffId) {
      where.staffId = staffId;
    }

    if (verifiedById) {
      where.verifiedById = verifiedById;
    }

    if (assignmentId) {
      where.assignmentId = assignmentId;
    }

    return this.databaseService.workSubmission.findMany({
      where,
      include: {
        assignment: {
          include: {
            responsibility: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.databaseService.workSubmission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            responsibility: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: number, updateWorkSubmissionDto: Prisma.WorkSubmissionUpdateInput) {
    try {
      return await this.databaseService.workSubmission.update({
        where: { id },
        data: updateWorkSubmissionDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'Record not found. Ensure work submission ID and any referenced employee IDs exist.',
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.databaseService.workSubmission.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Work submission with ID ${id} not found.`);
        }
      }
      throw error;
    }
  }
}
