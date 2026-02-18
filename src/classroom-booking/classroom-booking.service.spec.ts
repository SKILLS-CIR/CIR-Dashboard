import { Test, TestingModule } from '@nestjs/testing';
import { ClassroomBookingService } from './classroom-booking.service';

describe('ClassroomBookingService', () => {
  let service: ClassroomBookingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassroomBookingService],
    }).compile();

    service = module.get<ClassroomBookingService>(ClassroomBookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
