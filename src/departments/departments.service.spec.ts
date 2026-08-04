import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentType } from '@prisma/client';

import { DepartmentsService } from './departments.service';
import { DatabaseService } from '../database/database.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let databaseService: typeof mockDatabaseService;

  const mockDatabaseService = {
    department: {
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
        DepartmentsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = moduleRef.get<DepartmentsService>(DepartmentsService);
    databaseService = moduleRef.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create department using provided type or default to TEACHING', async () => {
      const dto = { name: 'Computer Science', description: 'CS Dept' };
      const mockResult = { id: 1, ...dto, type: DepartmentType.TEACHING };
      mockDatabaseService.department.create.mockResolvedValue(mockResult);

      const result = await service.create(dto);

      expect(databaseService.department.create).toHaveBeenCalledWith({
        data: {
          name: 'Computer Science',
          description: 'CS Dept',
          type: DepartmentType.TEACHING,
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should create department with explicitly specified type', async () => {
      const dto = {
        name: 'Administration',
        type: DepartmentType.NON_TEACHING,
      };
      mockDatabaseService.department.create.mockResolvedValue({ id: 2, ...dto });

      await service.create(dto);

      expect(databaseService.department.create).toHaveBeenCalledWith({
        data: {
          name: 'Administration',
          description: undefined,
          type: DepartmentType.NON_TEACHING,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all departments when type filter is omitted', async () => {
      const mockDepts = [{ id: 1, name: 'CS' }, { id: 2, name: 'Admin' }];
      mockDatabaseService.department.findMany.mockResolvedValue(mockDepts);

      const result = await service.findAll();

      expect(databaseService.department.findMany).toHaveBeenCalledWith();
      expect(result).toEqual(mockDepts);
    });

    it('should filter departments by type when type parameter is passed', async () => {
      const mockDepts = [{ id: 1, name: 'CS', type: DepartmentType.TEACHING }];
      mockDatabaseService.department.findMany.mockResolvedValue(mockDepts);

      const result = await service.findAll(DepartmentType.TEACHING);

      expect(databaseService.department.findMany).toHaveBeenCalledWith({
        where: { type: DepartmentType.TEACHING },
      });
      expect(result).toEqual(mockDepts);
    });
  });

  describe('findOne', () => {
    it('should return department by id', async () => {
      const mockDept = { id: 1, name: 'CS' };
      mockDatabaseService.department.findUnique.mockResolvedValue(mockDept);

      const result = await service.findOne(1);

      expect(databaseService.department.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockDept);
    });
  });

  describe('update', () => {
    it('should update department by id', async () => {
      const updateDto = { name: 'CS Updated' };
      const mockUpdated = { id: 1, name: 'CS Updated' };
      mockDatabaseService.department.update.mockResolvedValue(mockUpdated);

      const result = await service.update(1, updateDto);

      expect(databaseService.department.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('remove', () => {
    it('should delete department by id', async () => {
      const mockDeleted = { id: 1 };
      mockDatabaseService.department.delete.mockResolvedValue(mockDeleted);

      const result = await service.remove(1);

      expect(databaseService.department.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockDeleted);
    });
  });
});
