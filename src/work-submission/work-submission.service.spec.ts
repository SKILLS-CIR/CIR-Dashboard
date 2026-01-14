import { Test, TestingModule } from '@nestjs/testing';
import { WorkSubmissionService } from './work-submission.service';

describe('WorkSubmissionService', () => {
  let service: WorkSubmissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkSubmissionService],
    }).compile();

    service = module.get<WorkSubmissionService>(WorkSubmissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
