import { Test, TestingModule } from '@nestjs/testing';
import { WorkSubmissionController } from './work-submission.controller';
import { WorkSubmissionService } from './work-submission.service';

describe('WorkSubmissionController', () => {
  let controller: WorkSubmissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkSubmissionController],
      providers: [WorkSubmissionService],
    }).compile();

    controller = module.get<WorkSubmissionController>(WorkSubmissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
