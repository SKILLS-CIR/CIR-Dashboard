import { Test, TestingModule } from '@nestjs/testing';
import { SubDepartmentType } from '@prisma/client';

import { SubDepartmentsController } from './sub-departments.controller';
import { SubDepartmentsService } from './sub-departments.service';

describe('SubDepartmentsController', () => {
  let controller: SubDepartmentsController;
  let service: SubDepartmentsService;

  const mockSubDepartmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SubDepartmentsController],
      providers: [
        {
          provide: SubDepartmentsService,
          useValue: mockSubDepartmentsService,
        },
      ],
    }).compile();

    controller = moduleRef.get<SubDepartmentsController>(
      SubDepartmentsController,
    );
    service = moduleRef.get<SubDepartmentsService>(
      SubDepartmentsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to subDepartmentsService.create', async () => {
      const dto = {
        name: 'Full Stack',
        departmentId: 1,
        type: SubDepartmentType.SKILLS,
      };
      mockSubDepartmentsService.create.mockResolvedValue({ id: 1, ...dto });

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('findAll', () => {
    it('should pass type query parameter to subDepartmentsService.findAll', async () => {
      mockSubDepartmentsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(SubDepartmentType.SKILLS);

      expect(service.findAll).toHaveBeenCalledWith(SubDepartmentType.SKILLS);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should parse string id and call subDepartmentsService.findOne', async () => {
      mockSubDepartmentsService.findOne.mockResolvedValue({ id: 1 });

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update', () => {
    it('should parse string id and call subDepartmentsService.update', async () => {
      const updateDto = { name: 'Updated Name' };
      mockSubDepartmentsService.update.mockResolvedValue({ id: 1, name: 'Updated Name' });

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual({ id: 1, name: 'Updated Name' });
    });
  });

  describe('remove', () => {
    it('should parse string id and call subDepartmentsService.remove', async () => {
      mockSubDepartmentsService.remove.mockResolvedValue({ id: 1 });

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
