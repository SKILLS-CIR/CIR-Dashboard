import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentType } from '@prisma/client';

import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let service: DepartmentsService;

  const mockDepartmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        {
          provide: DepartmentsService,
          useValue: mockDepartmentsService,
        },
      ],
    }).compile();

    controller = moduleRef.get<DepartmentsController>(DepartmentsController);
    service = moduleRef.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to departmentsService.create', async () => {
      const dto = { name: 'CS', type: DepartmentType.TEACHING };
      mockDepartmentsService.create.mockResolvedValue({ id: 1, ...dto });

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('findAll', () => {
    it('should pass type parameter to departmentsService.findAll', async () => {
      mockDepartmentsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(DepartmentType.TEACHING);

      expect(service.findAll).toHaveBeenCalledWith(DepartmentType.TEACHING);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should parse string id and call departmentsService.findOne', async () => {
      mockDepartmentsService.findOne.mockResolvedValue({ id: 1 });

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update', () => {
    it('should parse string id and call departmentsService.update', async () => {
      const updateDto = { name: 'New Name' };
      mockDepartmentsService.update.mockResolvedValue({ id: 1, name: 'New Name' });

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual({ id: 1, name: 'New Name' });
    });
  });

  describe('remove', () => {
    it('should parse string id and call departmentsService.remove', async () => {
      mockDepartmentsService.remove.mockResolvedValue({ id: 1 });

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
