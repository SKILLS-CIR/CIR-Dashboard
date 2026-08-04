import { Test, TestingModule } from '@nestjs/testing';

import { AssignmentService } from './assignment.service';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';

describe('AssignmentService', () => {
  let service: AssignmentService;
  let databaseService: typeof mockDatabaseService;
  let notificationService: typeof mockNotificationService;

  const mockDatabaseService = {
    responsibilityAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockNotificationService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = moduleRef.get<AssignmentService>(AssignmentService);
    databaseService = moduleRef.get(DatabaseService);
    notificationService = moduleRef.get(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an assignment and send a notification when responsibility title exists', async () => {
      const mockDto = {
        staffId: 10,
        responsibilityId: 5,
      } as any;

      const mockCreatedAssignment = {
        id: 1,
        staffId: 10,
        responsibilityId: 5,
        responsibility: {
          title: 'Conduct Lab Audit',
        },
      };

      databaseService.responsibilityAssignment.create.mockResolvedValue(mockCreatedAssignment);
      notificationService.create.mockResolvedValue(true);

      const result = await service.create(mockDto);

      expect(databaseService.responsibilityAssignment.create).toHaveBeenCalledWith({
        data: mockDto,
        include: {
          responsibility: { select: { title: true } },
        },
      });
      expect(notificationService.create).toHaveBeenCalledWith({
        userId: 10,
        title: 'New Responsibility Assigned',
        message: 'You have been assigned: Conduct Lab Audit',
        type: 'ASSIGNMENT_CREATED',
        entityId: 1,
        entityType: 'ASSIGNMENT',
      });
      expect(result).toEqual(mockCreatedAssignment);
    });

    it('should fallback to default notification message when responsibility title is missing', async () => {
      const mockDto = {
        staffId: 10,
        responsibilityId: 5,
      } as any;

      const mockCreatedAssignment = {
        id: 2,
        staffId: 10,
        responsibilityId: 5,
        responsibility: null,
      };

      databaseService.responsibilityAssignment.create.mockResolvedValue(mockCreatedAssignment);
      notificationService.create.mockResolvedValue(true);

      const result = await service.create(mockDto);

      expect(notificationService.create).toHaveBeenCalledWith({
        userId: 10,
        title: 'New Responsibility Assigned',
        message: 'You have been assigned: a new responsibility',
        type: 'ASSIGNMENT_CREATED',
        entityId: 2,
        entityType: 'ASSIGNMENT',
      });
      expect(result).toEqual(mockCreatedAssignment);
    });

    it('should catch and log error if notificationService.create throws', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockDto = {
        staffId: 10,
        responsibilityId: 5,
      } as any;

      const mockCreatedAssignment = {
        id: 3,
        staffId: 10,
        responsibilityId: 5,
        responsibility: { title: 'Test Task' },
      };

      databaseService.responsibilityAssignment.create.mockResolvedValue(mockCreatedAssignment);
      notificationService.create.mockRejectedValue(new Error('Notification service failed'));

      const result = await service.create(mockDto);

      expect(result).toEqual(mockCreatedAssignment);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send assignment notification:',
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('findAll', () => {
    it('should return all assignments without filters when no arguments are passed', async () => {
      const mockAssignments = [{ id: 1 }, { id: 2 }];
      databaseService.responsibilityAssignment.findMany.mockResolvedValue(mockAssignments);

      const result = await service.findAll();

      expect(databaseService.responsibilityAssignment.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          responsibility: true,
          staff: true,
        },
      });
      expect(result).toEqual(mockAssignments);
    });

    it('should filter by responsibilityId and staffId when provided', async () => {
      const mockAssignments = [{ id: 1 }];
      databaseService.responsibilityAssignment.findMany.mockResolvedValue(mockAssignments);

      const result = await service.findAll(5, 10);

      expect(databaseService.responsibilityAssignment.findMany).toHaveBeenCalledWith({
        where: {
          responsibilityId: 5,
          staffId: 10,
        },
        include: {
          responsibility: true,
          staff: true,
        },
      });
      expect(result).toEqual(mockAssignments);
    });
  });

  describe('findOne', () => {
    it('should return an assignment by id', async () => {
      const mockAssignment = { id: 1, staffId: 10 };
      databaseService.responsibilityAssignment.findUnique.mockResolvedValue(mockAssignment);

      const result = await service.findOne(1);

      expect(databaseService.responsibilityAssignment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          responsibility: true,
          staff: true,
        },
      });
      expect(result).toEqual(mockAssignment);
    });
  });

  describe('update', () => {
    it('should update an assignment by id', async () => {
      const updateDto = { status: 'COMPLETED' } as any;
      const mockUpdated = { id: 1, status: 'COMPLETED' };
      databaseService.responsibilityAssignment.update.mockResolvedValue(mockUpdated);

      const result = await service.update(1, updateDto);

      expect(databaseService.responsibilityAssignment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('remove', () => {
    it('should delete an assignment by id', async () => {
      const mockDeleted = { id: 1 };
      databaseService.responsibilityAssignment.delete.mockResolvedValue(mockDeleted);

      const result = await service.remove(1);

      expect(databaseService.responsibilityAssignment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockDeleted);
    });
  });

  describe('findAllScoped', () => {
    describe('STAFF role', () => {
      it('should fetch scoped assignments for STAFF with date range logic', async () => {
        const mockAssignments = [{ id: 1, staffId: 10 }];
        databaseService.responsibilityAssignment.findMany.mockResolvedValue(mockAssignments);

        const result = await service.findAllScoped(
          10,
          'STAFF',
          null,
          undefined,
          undefined,
          undefined,
        );

        expect(databaseService.responsibilityAssignment.findMany).toHaveBeenCalledWith({
          where: {
            staffId: 10,
            responsibility: {
              isActive: true,
              OR: [
                { startDate: null, endDate: null },
                {
                  AND: [
                    { OR: [{ startDate: null }, { startDate: { lte: expect.any(Date) } }] },
                    { OR: [{ endDate: null }, { endDate: { gte: expect.any(Date) } }] },
                  ],
                },
              ],
            },
          },
          include: expect.any(Object),
        });
        expect(result).toEqual(mockAssignments);
      });

      it('should include responsibilityId and status filters for STAFF when provided', async () => {
        databaseService.responsibilityAssignment.findMany.mockResolvedValue([]);

        await service.findAllScoped(
          10,
          'STAFF',
          null,
          undefined,
          5,
          'PENDING',
        );

        expect(databaseService.responsibilityAssignment.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            staffId: 10,
            responsibilityId: 5,
            status: 'PENDING',
          }),
          include: expect.any(Object),
        });
      });
    });

    describe('MANAGER role', () => {
      it('should return empty array if MANAGER has null subDepartmentId', async () => {
        const result = await service.findAllScoped(
          20,
          'MANAGER',
          null,
          undefined,
          undefined,
          undefined,
        );

        expect(result).toEqual([]);
        expect(databaseService.responsibilityAssignment.findMany).not.toHaveBeenCalled();
      });

      it('should fetch assignments scoped to subDepartmentId for MANAGER', async () => {
        const mockAssignments = [{ id: 2 }];
        databaseService.responsibilityAssignment.findMany.mockResolvedValue(mockAssignments);

        const result = await service.findAllScoped(
          20,
          'MANAGER',
          3,
          10,
          5,
          'APPROVED',
        );

        expect(databaseService.responsibilityAssignment.findMany).toHaveBeenCalledWith({
          where: {
            responsibility: {
              subDepartmentId: 3,
            },
            staffId: 10,
            responsibilityId: 5,
            status: 'APPROVED',
          },
          include: expect.any(Object),
        });
        expect(result).toEqual(mockAssignments);
      });
    });

    describe('ADMIN role', () => {
      it('should fetch all assignments for ADMIN with optional filters', async () => {
        const mockAssignments = [{ id: 3 }];
        databaseService.responsibilityAssignment.findMany.mockResolvedValue(mockAssignments);

        const result = await service.findAllScoped(
          1,
          'ADMIN',
          null,
          10,
          undefined,
          'PENDING',
        );

        expect(databaseService.responsibilityAssignment.findMany).toHaveBeenCalledWith({
          where: {
            staffId: 10,
            status: 'PENDING',
          },
          include: expect.any(Object),
        });
        expect(result).toEqual(mockAssignments);
      });
    });

    describe('Parameterized role tests', () => {
      const cases: Array<[string, string, number | null, number]> = [
        [
          'unhandled role GUEST',
          'GUEST',
          1,
          0,
        ],
        [
          'empty role string',
          '',
          1,
          0,
        ],
        [
          'MANAGER with null subDepartmentId',
          'MANAGER',
          null,
          0,
        ],
      ];

      it.each(cases)(
        'should return empty array for %s',
        async (
          caseName: string,
          role: string,
          subDeptId: number | null,
          expectedCalls: number,
        ) => {
          const result = await service.findAllScoped(
            1,
            role,
            subDeptId,
            undefined,
            undefined,
            undefined,
          );

          expect(result).toEqual([]);
          expect(databaseService.responsibilityAssignment.findMany).toHaveBeenCalledTimes(expectedCalls);
        },
      );
    });
  });
});
