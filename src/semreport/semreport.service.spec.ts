import { Test, TestingModule } from '@nestjs/testing';
import { SemreportService } from './semreport.service';

describe('SemreportService', () => {
  let service: SemreportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SemreportService],
    }).compile();

    service = module.get<SemreportService>(SemreportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
