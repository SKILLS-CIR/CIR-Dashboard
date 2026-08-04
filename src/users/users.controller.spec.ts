import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateAlluserinfoDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    replace: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = moduleRef.get<UsersController>(UsersController);
    service = moduleRef.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with provided role parameter', () => {
      const mockResult = [{ id: 1, name: 'Alice', role: 'ADMIN' }];
      mockUsersService.findAll.mockReturnValue(mockResult);

      const result = controller.findAll('ADMIN');

      expect(service.findAll).toHaveBeenCalledWith('ADMIN');
      expect(result).toEqual(mockResult);
    });

    it('should call service.findAll with undefined when no role is given', () => {
      mockUsersService.findAll.mockReturnValue([]);

      controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with parsed id parameter', () => {
      const mockUser = { id: 1, name: 'Alice' };
      mockUsersService.findOne.mockReturnValue(mockUser);

      const result = controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should call service.create with dto', () => {
      const dto: CreateUserDto = {
        name: 'New User',
        email: 'new@example.com',
        role: 'STAFF',
        password: 'pass',
        jobTitle: 'Developer',
      };
      mockUsersService.create.mockReturnValue({ id: 5, ...dto });

      const result = controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 5, ...dto });
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', () => {
      const dto: UpdateUserDto = { name: 'Updated Name' };
      mockUsersService.update.mockReturnValue({ id: 1, name: 'Updated Name' });

      const result = controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ id: 1, name: 'Updated Name' });
    });
  });

  describe('replace', () => {
    it('should call service.replace with id and dto', () => {
      const dto: UpdateAlluserinfoDto = {
        name: 'Replaced User',
        email: 'replaced@example.com',
        role: 'MANAGER',
        password: 'newpassword',
        jobTitle: 'Lead',
      };
      mockUsersService.replace.mockReturnValue({ id: 1, ...dto });

      const result = controller.replace(1, dto);

      expect(service.replace).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('delete', () => {
    it('should call service.delete with id', () => {
      const mockDeletedUser = { id: 1, name: 'Alice' };
      mockUsersService.delete.mockReturnValue(mockDeletedUser);

      const result = controller.delete(1);

      expect(service.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDeletedUser);
    });
  });
});
