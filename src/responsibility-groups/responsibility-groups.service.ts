import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  CreateResponsibilityGroupDto,
  UpdateResponsibilityGroupDto,
  AddResponsibilitiesToGroupDto,
  AssignGroupToStaffDto,
  InlineResponsibilityDto,
} from './dto';

@Injectable()
export class ResponsibilityGroupsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create a new Responsibility Group
   * Managers can only create groups within their sub-department
   */
  async create(
    createDto: CreateResponsibilityGroupDto,
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
  ) {
    // Validate user has a sub-department
    if (!userSubDepartmentId) {
      throw new BadRequestException(
        'User must be assigned to a sub-department to create responsibility groups',
      );
    }

    // Staff cannot create groups
    if (userRole === 'STAFF') {
      throw new ForbiddenException('Staff cannot create responsibility groups');
    }

    // Use transaction to create group and optionally add responsibilities
    return this.databaseService.$transaction(async (tx) => {
      // 1. Create the group
      const group = await tx.responsibilityGroup.create({
        data: {
          name: createDto.name,
          description: createDto.description,
          cycle: createDto.cycle,
          createdById: userId,
          subDepartmentId: userSubDepartmentId,
        },
      });

      // 2. Add existing responsibilities if provided
      if (createDto.responsibilityIds && createDto.responsibilityIds.length > 0) {
        // Deduplicate responsibility IDs
        const uniqueIds = [...new Set(createDto.responsibilityIds)];

        // Verify all responsibilities exist and belong to the same sub-department
        const responsibilities = await tx.responsibility.findMany({
          where: {
            id: { in: uniqueIds },
          },
        });

        if (responsibilities.length !== uniqueIds.length) {
          throw new NotFoundException('Some responsibilities were not found');
        }

        // Verify all belong to the same sub-department
        for (const resp of responsibilities) {
          if (resp.subDepartmentId !== userSubDepartmentId) {
            throw new ForbiddenException(
              `Responsibility ${resp.id} belongs to a different sub-department`,
            );
          }
        }

        // Create group items in batch
        await tx.responsibilityGroupItem.createMany({
          data: uniqueIds.map((respId, index) => ({
            groupId: group.id,
            responsibilityId: respId,
            displayOrder: index,
          })),
        });
      }

      // 3. Create new responsibilities inline if provided
      if (createDto.newResponsibilities && createDto.newResponsibilities.length > 0) {
        const startOrder = createDto.responsibilityIds ? [...new Set(createDto.responsibilityIds)].length : 0;
        
        for (let i = 0; i < createDto.newResponsibilities.length; i++) {
          const newResp = createDto.newResponsibilities[i];
          // Create the responsibility using existing model structure
          const responsibility = await tx.responsibility.create({
            data: {
              title: newResp.title,
              description: newResp.description,
              cycle: newResp.cycle,
              startDate: newResp.startDate ? new Date(newResp.startDate) : undefined,
              endDate: newResp.endDate ? new Date(newResp.endDate) : undefined,
              isStaffCreated: false,
              createdById: userId,
              subDepartmentId: userSubDepartmentId,
            },
          });

          // Add to group
          await tx.responsibilityGroupItem.create({
            data: {
              groupId: group.id,
              responsibilityId: responsibility.id,
              displayOrder: startOrder + i,
            },
          });
        }
      }

      // Fetch the complete group with items
      return tx.responsibilityGroup.findUnique({
        where: { id: group.id },
        include: {
          items: {
            include: {
              responsibility: true,
            },
            orderBy: {
              displayOrder: 'asc',
            },
          },
        },
      });
    }, {
      timeout: 30000, // 30 seconds timeout for complex operations
    });
  }

  /**
   * Find all responsibility groups (scoped by role)
   */
  async findAll(
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
  ) {
    const where: any = {};

    // Staff cannot see groups (they only see individual responsibilities)
    if (userRole === 'STAFF') {
      throw new ForbiddenException('Staff cannot view responsibility groups');
    }

    // Manager: Only their sub-department groups
    if (userRole === 'MANAGER') {
      if (!userSubDepartmentId) {
        return [];
      }
      where.subDepartmentId = userSubDepartmentId;
    }

    // ADMIN: No restrictions

    return this.databaseService.responsibilityGroup.findMany({
      where,
      include: {
        subDepartment: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            responsibility: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        groupAssignments: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
            groupAssignments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find a single responsibility group by ID
   */
  async findOne(
    id: number,
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
  ) {
    const group = await this.databaseService.responsibilityGroup.findUnique({
      where: { id },
      include: {
        subDepartment: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            responsibility: {
              include: {
                assignments: {
                  include: {
                    staff: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        groupAssignments: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            assignedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Authorization check - STAFF cannot view groups at all
    if (userRole === 'STAFF') {
      throw new ForbiddenException('Staff cannot view responsibility groups');
    }

    // For MANAGERs, verify the group belongs to their sub-department
    if (userRole === 'MANAGER') {
      if (!userSubDepartmentId) {
        throw new ForbiddenException('Manager must have a sub-department assigned');
      }
      
      // Re-fetch with subDepartmentId filter to ensure manager can only see their groups
      const managerGroup = await this.databaseService.responsibilityGroup.findFirst({
        where: {
          id,
          subDepartmentId: userSubDepartmentId,
        },
        include: {
          items: {
            include: {
              responsibility: true,
            },
            orderBy: { displayOrder: 'asc' },
          },
          groupAssignments: {
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!managerGroup) {
        throw new NotFoundException(`Responsibility group with ID ${id} not found`);
      }

      return managerGroup;
    }

    // ADMIN can see all groups
    if (!group) {
      throw new NotFoundException(`Responsibility group with ID ${id} not found`);
    }

    return group;
  }

  /**
   * Update a responsibility group
   */
  async update(
    id: number,
    updateDto: UpdateResponsibilityGroupDto,
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
  ) {
    // First verify the group exists and user has access
    await this.findOne(id, userId, userRole, userSubDepartmentId);

    return this.databaseService.responsibilityGroup.update({
      where: { id },
      data: updateDto,
      include: {
        items: {
          include: {
            responsibility: true,
          },
        },
      },
    });
  }

  /**
   * Delete a responsibility group
   * Note: This only deletes the group and group items, NOT the underlying responsibilities
   */
  async remove(
    id: number,
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
  ) {
    // First verify the group exists and user has access
    await this.findOne(id, userId, userRole, userSubDepartmentId);

    return this.databaseService.responsibilityGroup.delete({
      where: { id },
    });
  }

  /**
   * Add responsibilities to an existing group
   */
  async addResponsibilities(
    groupId: number,
    addDto: AddResponsibilitiesToGroupDto,
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
  ) {
    // Verify access to the group
    const group = await this.findOne(groupId, userId, userRole, userSubDepartmentId);

    return this.databaseService.$transaction(async (tx) => {
      // Get current max display order
      const maxOrderItem = await tx.responsibilityGroupItem.findFirst({
        where: { groupId },
        orderBy: { displayOrder: 'desc' },
      });
      let order = addDto.displayOrderStart ?? ((maxOrderItem?.displayOrder ?? -1) + 1);
      const addedResponsibilityIds: number[] = [];

      // 1. Add existing responsibilities
      if (addDto.responsibilityIds && addDto.responsibilityIds.length > 0) {
        // Deduplicate responsibility IDs
        const uniqueIds = [...new Set(addDto.responsibilityIds)];

        // Verify responsibilities exist and belong to same sub-department
        const responsibilities = await tx.responsibility.findMany({
          where: {
            id: { in: uniqueIds },
          },
        });

        if (responsibilities.length !== uniqueIds.length) {
          throw new NotFoundException('Some responsibilities were not found');
        }

        for (const resp of responsibilities) {
          if (resp.subDepartmentId !== group.subDepartmentId) {
            throw new ForbiddenException(
              `Responsibility ${resp.id} belongs to a different sub-department`,
            );
          }
        }

        // Check which ones already exist in the group
        const existingItems = await tx.responsibilityGroupItem.findMany({
          where: {
            groupId,
            responsibilityId: { in: uniqueIds },
          },
        });
        const existingRespIds = new Set(existingItems.map(item => item.responsibilityId));

        // Filter out already existing ones
        const newRespIds = uniqueIds.filter(id => !existingRespIds.has(id));

        if (newRespIds.length > 0) {
          // Batch create items
          await tx.responsibilityGroupItem.createMany({
            data: newRespIds.map((respId, index) => ({
              groupId,
              responsibilityId: respId,
              displayOrder: order + index,
            })),
          });
          order += newRespIds.length;
          addedResponsibilityIds.push(...newRespIds);
        }
      }

      // 2. Create and add new responsibilities inline
      if (addDto.newResponsibilities && addDto.newResponsibilities.length > 0) {
        for (const newResp of addDto.newResponsibilities) {
          const responsibility = await tx.responsibility.create({
            data: {
              title: newResp.title,
              description: newResp.description,
              cycle: newResp.cycle,
              startDate: newResp.startDate ? new Date(newResp.startDate) : undefined,
              endDate: newResp.endDate ? new Date(newResp.endDate) : undefined,
              isStaffCreated: false,
              createdById: userId,
              subDepartmentId: group.subDepartmentId,
            },
          });

          await tx.responsibilityGroupItem.create({
            data: {
              groupId,
              responsibilityId: responsibility.id,
              displayOrder: order++,
            },
          });
          addedResponsibilityIds.push(responsibility.id);
        }
      }

      // Fetch the added items with responsibilities
      const addedItems = await tx.responsibilityGroupItem.findMany({
        where: {
          groupId,
          responsibilityId: { in: addedResponsibilityIds },
        },
        include: {
          responsibility: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      });

      return {
        groupId,
        addedItems,
        totalAdded: addedItems.length,
      };
    }, {
      timeout: 30000, // 30 seconds timeout
    });
  }

  /**
   * Remove a responsibility from a group
   * Note: This only removes the association, not the responsibility itself
   */
  async removeResponsibilityFromGroup(
    groupId: number,
    responsibilityId: number,
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
  ) {
    // Verify access to the group
    await this.findOne(groupId, userId, userRole, userSubDepartmentId);

    const item = await this.databaseService.responsibilityGroupItem.findUnique({
      where: {
        groupId_responsibilityId: {
          groupId,
          responsibilityId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Responsibility ${responsibilityId} is not in group ${groupId}`,
      );
    }

    return this.databaseService.responsibilityGroupItem.delete({
      where: { id: item.id },
    });
  }

  /**
   * Assign a responsibility group to staff members
   * This creates individual ResponsibilityAssignment records for each
   * responsibility in the group, using the existing assignment logic.
   */
  async assignToStaff(
    groupId: number,
    assignDto: AssignGroupToStaffDto,
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
  ) {
    // Verify access to the group - findOne returns group with items included
    const group = await this.findOne(groupId, userId, userRole, userSubDepartmentId) as any;

    if (!group.items || group.items.length === 0) {
      throw new BadRequestException('Cannot assign an empty group');
    }

    // Verify all staff members exist and belong to the same sub-department
    const staffMembers = await this.databaseService.employee.findMany({
      where: {
        id: { in: assignDto.staffIds },
        role: 'STAFF',
        isActive: true,
      },
    });

    if (staffMembers.length !== assignDto.staffIds.length) {
      throw new BadRequestException(
        'Some staff members were not found or are not active staff',
      );
    }

    // Manager can only assign to staff in their sub-department
    if (userRole === 'MANAGER') {
      for (const staff of staffMembers) {
        if (staff.subDepartmentId !== userSubDepartmentId) {
          throw new ForbiddenException(
            `Staff member ${staff.id} is not in your sub-department`,
          );
        }
      }
    }

    const dueDate = assignDto.dueDate ? new Date(assignDto.dueDate) : undefined;

    return this.databaseService.$transaction(async (tx) => {
      const results = {
        groupId,
        assignedTo: [] as any[],
        totalAssignmentsCreated: 0,
        skippedDuplicates: 0,
      };

      for (const staff of staffMembers) {
        const staffResult = {
          staffId: staff.id,
          staffName: staff.name,
          assignmentsCreated: [] as number[],
          skipped: [] as number[],
        };

        // Create individual ResponsibilityAssignment for each responsibility in the group
        for (const item of group.items) {
          // Check if assignment already exists (using existing unique constraint)
          const existingAssignment =
            await tx.responsibilityAssignment.findUnique({
              where: {
                responsibilityId_staffId: {
                  responsibilityId: item.responsibility.id,
                  staffId: staff.id,
                },
              },
            });

          if (existingAssignment) {
            // Assignment already exists, skip
            staffResult.skipped.push(item.responsibility.id);
            results.skippedDuplicates++;
          } else {
            // Create new assignment using existing logic/structure
            const assignment = await tx.responsibilityAssignment.create({
              data: {
                responsibilityId: item.responsibility.id,
                staffId: staff.id,
                status: 'PENDING',
                dueDate,
              },
            });
            staffResult.assignmentsCreated.push(assignment.id);
            results.totalAssignmentsCreated++;
          }
        }

        // Record the group assignment for auditing
        const existingGroupAssignment =
          await tx.responsibilityGroupAssignment.findUnique({
            where: {
              groupId_staffId: {
                groupId,
                staffId: staff.id,
              },
            },
          });

        if (!existingGroupAssignment) {
          await tx.responsibilityGroupAssignment.create({
            data: {
              groupId,
              staffId: staff.id,
              assignedById: userId,
            },
          });
        }

        results.assignedTo.push(staffResult);
      }

      return results;
    }, {
      timeout: 60000, // 60 seconds timeout for bulk assignments
    });
  }

  /**
   * Get all staff members assigned to a group
   */
  async getAssignedStaff(
    groupId: number,
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
  ) {
    // Verify access to the group
    await this.findOne(groupId, userId, userRole, userSubDepartmentId);

    return this.databaseService.responsibilityGroupAssignment.findMany({
      where: { groupId },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Unassign a group from a staff member
   * Note: This removes the group assignment record but does NOT remove
   * the individual ResponsibilityAssignment records (those remain intact)
   */
  async unassignFromStaff(
    groupId: number,
    staffId: number,
    userId: number,
    userRole: string,
    userSubDepartmentId: number | null,
  ) {
    // Verify access to the group
    await this.findOne(groupId, userId, userRole, userSubDepartmentId);

    const assignment =
      await this.databaseService.responsibilityGroupAssignment.findUnique({
        where: {
          groupId_staffId: {
            groupId,
            staffId,
          },
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        `Staff member ${staffId} is not assigned to group ${groupId}`,
      );
    }

    return this.databaseService.responsibilityGroupAssignment.delete({
      where: { id: assignment.id },
    });
  }
}
