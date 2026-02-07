import { Test, TestingModule } from '@nestjs/testing';
import { ResponsibilityGroupsService } from './responsibility-groups.service';
import { DatabaseService } from 'src/database/database.service';

describe('ResponsibilityGroupsService', () => {
  let service: ResponsibilityGroupsService;

  const mockDatabaseService = {
    responsibilityGroup: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    responsibilityGroupItem: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    responsibilityGroupAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    responsibility: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    responsibilityAssignment: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    employee: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockDatabaseService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsibilityGroupsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<ResponsibilityGroupsService>(ResponsibilityGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if user has no sub-department', async () => {
      await expect(
        service.create(
          { name: 'Test Group' },
          1,
          'MANAGER',
          null,
        ),
      ).rejects.toThrow('User must be assigned to a sub-department');
    });

    it('should throw ForbiddenException if user is STAFF', async () => {
      await expect(
        service.create(
          { name: 'Test Group' },
          1,
          'STAFF',
          1,
        ),
      ).rejects.toThrow('Staff cannot create responsibility groups');
    });
  });
});
