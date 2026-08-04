import { Test, TestingModule } from '@nestjs/testing';

import { ClassroomController } from './classroom.controller';
import { ClassroomService } from './classroom.service';

describe('ClassroomController', () => {
  let controller: ClassroomController;
  let service: ClassroomService;

  const mockClassroomService = {
    create: jest.fn(),
    findAll: jest.fn(),
    disable: jest.fn(),
    enable: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ClassroomController],
      providers: [
        {
          provide: ClassroomService,
          useValue: mockClassroomService,
        },
      ],
    }).compile();

    controller = moduleRef.get<ClassroomController>(ClassroomController);
    service = moduleRef.get<ClassroomService>(ClassroomService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to classroomService.create', async () => {
      const dto = { name: 'Lab 101' };
      const mockResult = { id: 1, name: 'Lab 101' };
      mockClassroomService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should delegate to classroomService.findAll', async () => {
      const mockList = [{ id: 1, name: 'Lab 101' }];
      mockClassroomService.findAll.mockResolvedValue(mockList);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockList);
    });
  });

  describe('disable', () => {
    it('should parse string id and call classroomService.disable', async () => {
      mockClassroomService.disable.mockResolvedValue({ id: 1, isActive: false });

      const result = await controller.disable('1');

      expect(service.disable).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, isActive: false });
    });
  });

  describe('enable', () => {
    it('should parse string id and call classroomService.enable', async () => {
      mockClassroomService.enable.mockResolvedValue({ id: 1, isActive: true });

      const result = await controller.enable('1');

      expect(service.enable).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, isActive: true });
    });
  });

  describe('delete', () => {
    it('should parse string id and call classroomService.delete', async () => {
      mockClassroomService.delete.mockResolvedValue({ id: 1 });

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
