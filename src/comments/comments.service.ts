import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CommentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createCommentDto: Prisma.CommentCreateInput) {
    try {
      return await this.databaseService.comment.create({
        data: createCommentDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'Referenced record not found. Ensure submission and author IDs exist.',
          );
        }
      }
      throw error;
    }
  }

  async findAll(submissionId?: number, authorId?: number) {
    const where: Prisma.CommentWhereInput = {};

    if (submissionId) {
      where.submissionId = submissionId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    return this.databaseService.comment.findMany({
      where,
      include: {
        submission: {
          select: {
            id: true,
            hoursWorked: true,
            staffComment: true,
            managerComment: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: number) {
    return this.databaseService.comment.findUnique({
      where: { id },
      include: {
        submission: {
          select: {
            id: true,
            hoursWorked: true,
            staffComment: true,
            managerComment: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async update(id: number, updateCommentDto: Prisma.CommentUpdateInput) {
    try {
      return await this.databaseService.comment.update({
        where: { id },
        data: updateCommentDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Comment with ID ${id} not found.`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.databaseService.comment.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Comment with ID ${id} not found.`);
        }
      }
      throw error;
    }
  }
}
