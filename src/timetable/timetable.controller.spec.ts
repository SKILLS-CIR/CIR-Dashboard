import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';

describe('TimetableController', () => {
  let controller: TimetableController;
  let service: TimetableService;

  const mockTimetableService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    removeEntry: jest.fn(),
    publish: jest.fn(),
    unpublish: jest.fn(),
    getExportData: jest.fn(),
    getAssignableStaff: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TimetableController],
      providers: [
        {
          provide: TimetableService,
          useValue: mockTimetableService,
        },
      ],
    }).compile();

    controller = moduleRef.get<TimetableController>(TimetableController);
    service = moduleRef.get<TimetableService>(TimetableService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException when startDate or endDate is missing', () => {
      const req = { user: { id: 1 } };

      expect(() => controller.create(5, '', '2026-06-01', req)).toThrow(
        BadRequestException,
      );
      expect(() => controller.create(5, '2026-01-01', '', req)).toThrow(
        'Start date and end date are required for creating a timetable',
      );
    });

    it('should delegate to timetableService.create when parameters are valid', async () => {
      const req = { user: { id: 1 } };
      mockTimetableService.create.mockResolvedValue({ id: 10 });

      const result = await controller.create(5, '2026-01-01', '2026-06-01', req);

      expect(service.create).toHaveBeenCalledWith(5, 1, '2026-01-01', '2026-06-01');
      expect(result).toEqual({ id: 10 });
    });
  });

  describe('findAll', () => {
    it('should call timetableService.findAll with user id', async () => {
      const req = { user: { id: 1 } };
      mockTimetableService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(1);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should parse string id and call timetableService.findOne', async () => {
      const req = { user: { id: 1 } };
      mockTimetableService.findOne.mockResolvedValue({ id: 10 });

      const result = await controller.findOne('10', req);

      expect(service.findOne).toHaveBeenCalledWith(10, 1);
      expect(result).toEqual({ id: 10 });
    });
  });

  describe('publish', () => {
    it('should parse string id and call timetableService.publish', async () => {
      const req = { user: { id: 1 } };
      mockTimetableService.publish.mockResolvedValue({ id: 10, isPublished: true });

      const result = await controller.publish('10', req);

      expect(service.publish).toHaveBeenCalledWith(10, 1);
      expect(result).toEqual({ id: 10, isPublished: true });
    });
  });
});
