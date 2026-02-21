import { Test, TestingModule } from '@nestjs/testing';
import { SemreportController } from './semreport.controller';
import { SemreportService } from './semreport.service';

describe('SemreportController', () => {
  let controller: SemreportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SemreportController],
      providers: [SemreportService],
    }).compile();

    controller = module.get<SemreportController>(SemreportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
