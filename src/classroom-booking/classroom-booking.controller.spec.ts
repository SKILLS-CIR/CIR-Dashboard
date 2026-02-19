import { Test, TestingModule } from '@nestjs/testing';
import { ClassroomBookingController } from './classroom-booking.controller';
import { ClassroomBookingService } from './classroom-booking.service';

describe('ClassroomBookingController', () => {
  let controller: ClassroomBookingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassroomBookingController],
      providers: [ClassroomBookingService],
    }).compile();

    controller = module.get<ClassroomBookingController>(
      ClassroomBookingController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
