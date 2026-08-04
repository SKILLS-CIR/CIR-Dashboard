import { Test, TestingModule } from '@nestjs/testing';

import { ClassroomBookingController } from './classroom-booking.controller';
import { ClassroomBookingService } from './classroom-booking.service';
import { CreateClassroomBookingDto } from './dto/create-classroom-booking.dto';

describe('ClassroomBookingController', () => {
  let controller: ClassroomBookingController;
  let service: ClassroomBookingService;

  const mockClassroomBookingService = {
    create: jest.fn(),
    findByDate: jest.fn(),
    findAllByDate: jest.fn(),
    findAllByClassroom: jest.fn(),
    cancel: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ClassroomBookingController],
      providers: [
        {
          provide: ClassroomBookingService,
          useValue: mockClassroomBookingService,
        },
      ],
    }).compile();

    controller = moduleRef.get<ClassroomBookingController>(
      ClassroomBookingController,
    );
    service = moduleRef.get<ClassroomBookingService>(
      ClassroomBookingService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto and user id from request', async () => {
      const dto: CreateClassroomBookingDto = {
        classroomId: 1,
        bookingDate: '2026-08-04',
        startTime: '2026-08-04T10:00:00Z',
        endTime: '2026-08-04T11:00:00Z',
      };
      const req = { user: { id: 10 } };
      mockClassroomBookingService.create.mockResolvedValue({ id: 100 });

      const result = await controller.create(dto, req);

      expect(service.create).toHaveBeenCalledWith(dto, 10);
      expect(result).toEqual({ id: 100 });
    });
  });

  describe('findByDate', () => {
    it('should call service.findByDate with parsed classroomId and date string', async () => {
      mockClassroomBookingService.findByDate.mockResolvedValue([]);

      const result = await controller.findByDate('1', '2026-08-04');

      expect(service.findByDate).toHaveBeenCalledWith(1, '2026-08-04');
      expect(result).toEqual([]);
    });
  });

  describe('findAllByDate', () => {
    it('should call service.findAllByDate with date string', async () => {
      mockClassroomBookingService.findAllByDate.mockResolvedValue([]);

      const result = await controller.findAllByDate('2026-08-04');

      expect(service.findAllByDate).toHaveBeenCalledWith('2026-08-04');
      expect(result).toEqual([]);
    });
  });

  describe('findAllByClassroom', () => {
    it('should call service.findAllByClassroom with parsed classroomId', async () => {
      mockClassroomBookingService.findAllByClassroom.mockResolvedValue([]);

      const result = await controller.findAllByClassroom('1');

      expect(service.findAllByClassroom).toHaveBeenCalledWith(1);
      expect(result).toEqual([]);
    });
  });

  describe('cancel', () => {
    it('should call service.cancel with parsed id and user id from request', async () => {
      const req = { user: { id: 10 } };
      mockClassroomBookingService.cancel.mockResolvedValue({ id: 5, isCancelled: true });

      const result = await controller.cancel('5', req);

      expect(service.cancel).toHaveBeenCalledWith(5, 10);
      expect(result).toEqual({ id: 5, isCancelled: true });
    });
  });
});
