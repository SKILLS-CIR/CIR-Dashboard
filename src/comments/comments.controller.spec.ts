import { Test, TestingModule } from '@nestjs/testing';

import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;

  const mockCommentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    }).compile();

    controller = moduleRef.get<CommentsController>(CommentsController);
    service = moduleRef.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to commentsService.create', async () => {
      const dto: any = { content: 'Nice job' };
      mockCommentsService.create.mockResolvedValue({ id: 1, ...dto });

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('findAll', () => {
    it('should parse optional submissionId and authorId query params', async () => {
      mockCommentsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll('1', '10');

      expect(service.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual([]);
    });

    it('should pass undefined when query params are omitted', async () => {
      mockCommentsService.findAll.mockResolvedValue([]);

      await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('findOne', () => {
    it('should parse string id and call commentsService.findOne', async () => {
      mockCommentsService.findOne.mockResolvedValue({ id: 1 });

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('update', () => {
    it('should parse string id and call commentsService.update', async () => {
      const dto: any = { content: 'Updated' };
      mockCommentsService.update.mockResolvedValue({ id: 1, ...dto });

      const result = await controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('remove', () => {
    it('should parse string id and call commentsService.remove', async () => {
      mockCommentsService.remove.mockResolvedValue({ id: 1 });

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });
});
