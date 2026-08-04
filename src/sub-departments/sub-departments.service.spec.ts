import { Test, TestingModule } from '@nestjs/testing';
import { SubDepartmentType } from '@prisma/client';

import { SubDepartmentsService } from './sub-departments.service';
import { DatabaseService } from '../database/database.service';

describe('SubDepartmentsService', () => {
  let service: SubDepartmentsService;
  let databaseService: typeof mockDatabaseService;

  const mockDatabaseService = {
    subDepartment: {
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
        SubDepartmentsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = moduleRef.get<SubDepartmentsService>(SubDepartmentsService);
    databaseService = moduleRef.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create sub-department defaulting type to SKILLS and connecting department', async () => {
      const dto = {
        name: 'Full Stack',
        description: 'Web & Mobile',
        departmentId: '1',
      };
      const mockResult = { id: 10, ...dto, type: SubDepartmentType.SKILLS };
      mockDatabaseService.subDepartment.create.mockResolvedValue(mockResult);

      const result = await service.create(dto);

      expect(databaseService.subDepartment.create).toHaveBeenCalledWith({
        data: {
          name: 'Full Stack',
          description: 'Web & Mobile',
          type: SubDepartmentType.SKILLS,
          department: { connect: { id: 1 } },
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should create sub-department with explicit type', async () => {
      const dto = {
        name: 'Aptitude',
        departmentId: 1,
        type: SubDepartmentType.QUANTS,
      };
      mockDatabaseService.subDepartment.create.mockResolvedValue({ id: 11, ...dto });

      await service.create(dto);

      expect(databaseService.subDepartment.create).toHaveBeenCalledWith({
        data: {
          name: 'Aptitude',
          description: undefined,
          type: SubDepartmentType.QUANTS,
          department: { connect: { id: 1 } },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all sub-departments when type filter is omitted', async () => {
      const mockSubDepts = [{ id: 1, name: 'Full Stack' }];
      mockDatabaseService.subDepartment.findMany.mockResolvedValue(mockSubDepts);

      const result = await service.findAll();

      expect(databaseService.subDepartment.findMany).toHaveBeenCalledWith();
      expect(result).toEqual(mockSubDepts);
    });

    it('should filter sub-departments by type when type parameter is provided', async () => {
      const mockSubDepts = [{ id: 1, name: 'Full Stack', type: SubDepartmentType.SKILLS }];
      mockDatabaseService.subDepartment.findMany.mockResolvedValue(mockSubDepts);

      const result = await service.findAll(SubDepartmentType.SKILLS);

      expect(databaseService.subDepartment.findMany).toHaveBeenCalledWith({
        where: { type: SubDepartmentType.SKILLS },
      });
      expect(result).toEqual(mockSubDepts);
    });
  });

  describe('findOne', () => {
    it('should return sub-department by id', async () => {
      const mockSubDept = { id: 1, name: 'Full Stack' };
      mockDatabaseService.subDepartment.findUnique.mockResolvedValue(mockSubDept);

      const result = await service.findOne(1);

      expect(databaseService.subDepartment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockSubDept);
    });
  });

  describe('update', () => {
    it('should update sub-department by id', async () => {
      const updateDto = { name: 'Full Stack Web' };
      const mockUpdated = { id: 1, name: 'Full Stack Web' };
      mockDatabaseService.subDepartment.update.mockResolvedValue(mockUpdated);

      const result = await service.update(1, updateDto);

      expect(databaseService.subDepartment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('remove', () => {
    it('should delete sub-department by id', async () => {
      const mockDeleted = { id: 1 };
      mockDatabaseService.subDepartment.delete.mockResolvedValue(mockDeleted);

      const result = await service.remove(1);

      expect(databaseService.subDepartment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockDeleted);
    });
  });
});
