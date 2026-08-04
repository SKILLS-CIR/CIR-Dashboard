import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
  classroom: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@prisma/client', () => {
  const original = jest.requireActual('@prisma/client');
  return {
    ...original,
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

import { ClassroomService } from './classroom.service';

describe('ClassroomService', () => {
  let service: ClassroomService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [ClassroomService],
    }).compile();

    service = moduleRef.get<ClassroomService>(ClassroomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const invalidNameCases: Array<[string, any]> = [
      ['empty string name', { name: '' }],
      ['whitespace name', { name: '   ' }],
      ['null name', { name: null }],
      ['undefined name', { name: undefined }],
    ];

    it.each(invalidNameCases)(
      'should throw BadRequestException when given %s',
      async (caseName: string, dto: { name: any }) => {
        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
        await expect(service.create(dto)).rejects.toThrow(
          'Classroom name is required',
        );
      },
    );

    it('should trim name and create classroom when valid name is provided', async () => {
      mockPrisma.classroom.create.mockResolvedValue({
        id: 1,
        name: 'Lab 101',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.create({ name: '  Lab 101  ' });

      expect(mockPrisma.classroom.create).toHaveBeenCalledWith({
        data: { name: 'Lab 101' },
      });
      expect(result.name).toBe('Lab 101');
    });
  });

  describe('findAll', () => {
    it('should return list of classrooms ordered by name asc', async () => {
      const mockList = [{ id: 1, name: 'Lab A' }];
      mockPrisma.classroom.findMany.mockResolvedValue(mockList as any);

      const result = await service.findAll();

      expect(mockPrisma.classroom.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
      expect(result).toEqual(mockList);
    });
  });

  describe('disable', () => {
    it('should update isActive to false', async () => {
      mockPrisma.classroom.update.mockResolvedValue({ id: 1, isActive: false } as any);

      const result = await service.disable(1);

      expect(mockPrisma.classroom.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('enable', () => {
    it('should update isActive to true', async () => {
      mockPrisma.classroom.update.mockResolvedValue({ id: 1, isActive: true } as any);

      const result = await service.enable(1);

      expect(mockPrisma.classroom.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: true },
      });
      expect(result.isActive).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete classroom by id', async () => {
      mockPrisma.classroom.delete.mockResolvedValue({ id: 1 } as any);

      const result = await service.delete(1);

      expect(mockPrisma.classroom.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ id: 1 });
    });
  });
});
