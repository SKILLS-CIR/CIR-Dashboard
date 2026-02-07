import { Test, TestingModule } from '@nestjs/testing';
import { ResponsibilityGroupsController } from './responsibility-groups.controller';
import { ResponsibilityGroupsService } from './responsibility-groups.service';

describe('ResponsibilityGroupsController', () => {
  let controller: ResponsibilityGroupsController;

  const mockResponsibilityGroupsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addResponsibilities: jest.fn(),
    removeResponsibilityFromGroup: jest.fn(),
    assignToStaff: jest.fn(),
    getAssignedStaff: jest.fn(),
    unassignFromStaff: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResponsibilityGroupsController],
      providers: [
        {
          provide: ResponsibilityGroupsService,
          useValue: mockResponsibilityGroupsService,
        },
      ],
    }).compile();

    controller = module.get<ResponsibilityGroupsController>(ResponsibilityGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
