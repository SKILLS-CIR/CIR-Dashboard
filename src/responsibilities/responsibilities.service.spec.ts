import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SubDepartmentType } from '@prisma/client';

import { ResponsibilitiesService } from './responsibilities.service';
import { DatabaseService } from '../database/database.service';

describe('ResponsibilitiesService', () => {
  let service: ResponsibilitiesService;
  let databaseService: typeof mockDatabaseService;

  const mockDatabaseService = {
    responsibility: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    responsibilityAssignment: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockDatabaseService)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsibilitiesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = moduleRef.get<ResponsibilitiesService>(ResponsibilitiesService);
    databaseService = moduleRef.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create responsibility directly', async () => {
      const dto: any = { title: 'Lab Audit', cycle: 'DAILY' };
      mockDatabaseService.responsibility.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto);

      expect(databaseService.responsibility.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('createWithDateValidation', () => {
    it('should throw BadRequestException when target subDepartmentId is missing', async () => {
      const dto: any = { title: 'Task' };

      await expect(
        service.createWithDateValidation(dto, 1, 'MANAGER', null),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createWithDateValidation(dto, 1, 'MANAGER', null),
      ).rejects.toThrow('Sub-department is required to create responsibilities');
    });

    it('should throw BadRequestException when a duplicate responsibility exists in sub-department', async () => {
      const dto: any = { title: 'Lab Audit', cycle: 'DAILY' };
      mockDatabaseService.responsibility.findFirst.mockResolvedValue({ id: 99 });

      await expect(
        service.createWithDateValidation(dto, 1, 'MANAGER', 5),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createWithDateValidation(dto, 1, 'MANAGER', 5),
      ).rejects.toThrow(
        'A responsibility with title "Lab Audit" already exists for cycle "DAILY" in this sub-department',
      );
    });

    describe('STAFF self-service flow', () => {
      it('should throw BadRequestException if staff has null subDepartmentId', async () => {
        const dto: any = { title: 'Task' };
        mockDatabaseService.responsibility.findFirst.mockResolvedValue(null);

        await expect(
          service.createWithDateValidation(dto, 1, 'STAFF', null),
        ).rejects.toThrow('Sub-department is required to create responsibilities');
      });

      it('should throw BadRequestException if dates are not for today', async () => {
        const dto: any = { title: 'Task', cycle: 'DAILY' };
        mockDatabaseService.responsibility.findFirst.mockResolvedValue(null);
        const pastDate = new Date('2020-01-01');

        await expect(
          service.createWithDateValidation(
            dto,
            1,
            'STAFF',
            5,
            pastDate,
            pastDate,
          ),
        ).rejects.toThrow('Staff can only create responsibilities for the current day');
      });
    });

    describe('MANAGER / ADMIN flow', () => {
      it('should throw BadRequestException if endDate is before startDate', async () => {
        const dto: any = { title: 'Task', cycle: 'DAILY' };
        mockDatabaseService.responsibility.findFirst.mockResolvedValue(null);
        const startDate = new Date('2026-08-10');
        const endDate = new Date('2026-08-01');

        await expect(
          service.createWithDateValidation(
            dto,
            1,
            'MANAGER',
            5,
            startDate,
            endDate,
          ),
        ).rejects.toThrow('End date cannot be before start date');
      });

      it('should create responsibility for MANAGER when valid dates are provided', async () => {
        const dto: any = { title: 'Task', cycle: 'DAILY' };
        mockDatabaseService.responsibility.findFirst.mockResolvedValue(null);
        mockDatabaseService.responsibility.create.mockResolvedValue({ id: 10, title: 'Task' });

        const result = await service.createWithDateValidation(
          dto,
          1,
          'MANAGER',
          5,
          new Date('2026-08-01'),
          new Date('2026-08-10'),
        );

        expect(databaseService.responsibility.create).toHaveBeenCalled();
        expect(result).toEqual({ id: 10, title: 'Task' });
      });
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if updated endDate is before startDate', async () => {
      const updateDto: any = {
        startDate: '2026-08-10',
        endDate: '2026-08-01',
      };

      await expect(service.update(1, updateDto)).rejects.toThrow(
        'End date cannot be before start date',
      );
    });

    it('should update responsibility successfully', async () => {
      const updateDto: any = { title: 'Updated Title' };
      mockDatabaseService.responsibility.update.mockResolvedValue({ id: 1, title: 'Updated Title' });

      const result = await service.update(1, updateDto);

      expect(databaseService.responsibility.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ title: 'Updated Title' }),
      });
      expect(result).toEqual({ id: 1, title: 'Updated Title' });
    });
  });

  describe('findAllScoped', () => {
    it('should return empty array for MANAGER with null subDepartmentId', async () => {
      const result = await service.findAllScoped(1, 'MANAGER', null);
      expect(result).toEqual([]);
      expect(databaseService.responsibility.findMany).not.toHaveBeenCalled();
    });

    it('should query responsibilities with subDepartmentId filter for MANAGER', async () => {
      mockDatabaseService.responsibility.findMany.mockResolvedValue([]);

      await service.findAllScoped(1, 'MANAGER', 5);

      expect(databaseService.responsibility.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ subDepartmentId: 5 }),
        }),
      );
    });
  });

  describe('isVisibleToUser', () => {
    it('should return false if responsibility is not found or inactive', async () => {
      mockDatabaseService.responsibility.findUnique.mockResolvedValue(null);

      const result = await service.isVisibleToUser(1, 10, 'STAFF', new Date());

      expect(result).toBe(false);
    });

    it('should return true for ADMIN or MANAGER if responsibility is active', async () => {
      mockDatabaseService.responsibility.findUnique.mockResolvedValue({
        id: 1,
        isActive: true,
        assignments: [],
      });

      const result = await service.isVisibleToUser(1, 10, 'MANAGER', new Date());

      expect(result).toBe(true);
    });

    it('should return false for STAFF if staff is not assigned', async () => {
      mockDatabaseService.responsibility.findUnique.mockResolvedValue({
        id: 1,
        isActive: true,
        assignments: [],
      });

      const result = await service.isVisibleToUser(1, 10, 'STAFF', new Date());

      expect(result).toBe(false);
    });
  });
});
