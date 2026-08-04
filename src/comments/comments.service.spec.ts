import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CommentsService } from './comments.service';
import { DatabaseService } from '../database/database.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let databaseService: typeof mockDatabaseService;

  const mockDatabaseService = {
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = moduleRef.get<CommentsService>(CommentsService);
    databaseService = moduleRef.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return comment', async () => {
      const dto: any = { content: 'Great work', submissionId: 1, authorId: 10 };
      const mockResult = { id: 1, ...dto };
      mockDatabaseService.comment.create.mockResolvedValue(mockResult);

      const result = await service.create(dto);

      expect(databaseService.comment.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(mockResult);
    });

    it('should throw NotFoundException when Prisma throws P2025 error code', async () => {
      const dto: any = { content: 'Test', submissionId: 999, authorId: 999 };
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.0' },
      );
      mockDatabaseService.comment.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow(
        'Referenced record not found. Ensure submission and author IDs exist.',
      );
    });

    it('should rethrow unknown errors during create', async () => {
      const dto: any = { content: 'Test' };
      const unknownError = new Error('Database connection failed');
      mockDatabaseService.comment.create.mockRejectedValue(unknownError);

      await expect(service.create(dto)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findAll', () => {
    it('should return comments matching submissionId and authorId when provided', async () => {
      const mockComments = [{ id: 1, content: 'Comment' }];
      mockDatabaseService.comment.findMany.mockResolvedValue(mockComments);

      const result = await service.findAll(1, 10);

      expect(databaseService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { submissionId: 1, authorId: 10 },
        }),
      );
      expect(result).toEqual(mockComments);
    });

    it('should return all comments without where clause when parameters are omitted', async () => {
      mockDatabaseService.comment.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(databaseService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('findOne', () => {
    it('should return comment by id', async () => {
      const mockComment = { id: 1, content: 'Test' };
      mockDatabaseService.comment.findUnique.mockResolvedValue(mockComment);

      const result = await service.findOne(1);

      expect(databaseService.comment.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(result).toEqual(mockComment);
    });
  });

  describe('update', () => {
    it('should update and return comment', async () => {
      const dto: any = { content: 'Updated comment' };
      mockDatabaseService.comment.update.mockResolvedValue({ id: 1, ...dto });

      const result = await service.update(1, dto);

      expect(databaseService.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
      expect(result).toEqual({ id: 1, ...dto });
    });

    it('should throw NotFoundException when P2025 error occurs on update', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.0' },
      );
      mockDatabaseService.comment.update.mockRejectedValue(prismaError);

      await expect(service.update(999, { content: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(999, { content: 'Test' })).rejects.toThrow(
        'Comment with ID 999 not found.',
      );
    });
  });

  describe('remove', () => {
    it('should delete and return comment', async () => {
      mockDatabaseService.comment.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(databaseService.comment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should throw NotFoundException when P2025 error occurs on delete', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.0' },
      );
      mockDatabaseService.comment.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow(
        'Comment with ID 999 not found.',
      );
    });
  });
});
