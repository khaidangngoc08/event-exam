import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoClient, ObjectId } from 'mongodb';
import { EventService } from './../src/event/event.service';

const mockEvent = {
  name: 'Test Event',
  startDate: '2023-07-10',
  dueDate: '2023-07-12',
  description: 'Test Event Description',
};

const mockEventDoc = (mock?: Partial<any>): any => ({
  name: mock?.name || 'Test Event',
  startDate: mock?.startDate || '2023-07-10',
  dueDate: mock?.dueDate || '2023-07-12',
  description: mock?.description || 'Test Event Description',
  _id: new ObjectId('507f1f77bcf86cd799439011'),
});

describe('EventService', () => {
  let service: EventService;
  let client: MongoClient;
  let db;
  let collection;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: MongoClient,
          useValue: {
            db: jest.fn().mockReturnValue({
              collection: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    client = module.get<MongoClient>(MongoClient);
    db = client.db();
    collection = db.collection('events');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new event', async () => {
      jest
        .spyOn(collection, 'insertOne')
        .mockImplementation(() => Promise.resolve({ _id: '123123' }));

      const createEventDto = mockEvent;
      const result = await service.create(createEventDto);

      expect(collection.insertOne).toHaveBeenCalledWith(createEventDto);
      expect(result).toEqual({ _id: expect.any(ObjectId), ...createEventDto });
    });
  });

  describe('findAll', () => {
    it('should return an array of events', async () => {
      jest.spyOn(collection, 'find').mockImplementation(() => ({
        toArray: () => Promise.resolve([mockEventDoc(mockEvent)]),
      }));

      const result = await service.findAll(1, 10, 'asc');

      expect(collection.find).toHaveBeenCalled();
      expect(result).toEqual([mockEventDoc(mockEvent)]);
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      jest
        .spyOn(collection, 'findOne')
        .mockImplementation(() => Promise.resolve(mockEventDoc(mockEvent)));

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(collection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId('507f1f77bcf86cd799439011'),
      });
      expect(result).toEqual(mockEventDoc(mockEvent));
    });

    it('should throw a NotFoundException if event not found', async () => {
      jest
        .spyOn(collection, 'findOne')
        .mockImplementation(() => Promise.resolve(null));

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      jest
        .spyOn(collection, 'updateOne')
        .mockImplementation(() => Promise.resolve({ matchedCount: 1 }));

      const updateEventDto = { name: 'Updated Event' };
      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateEventDto,
      );

      expect(collection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId('507f1f77bcf86cd799439011') },
        { $set: updateEventDto },
      );
      expect(result).toEqual({
        _id: expect.any(ObjectId),
        ...mockEvent,
        ...updateEventDto,
      });
    });

    it('should throw a NotFoundException if event not found', async () => {
      jest
        .spyOn(collection, 'updateOne')
        .mockImplementation(() => Promise.resolve({ matchedCount: 0 }));

      const updateEventDto = { name: 'Updated Event' };
      await expect(
        service.update('507f1f77bcf86cd799439011', updateEventDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an event', async () => {
      jest
        .spyOn(collection, 'deleteOne')
        .mockImplementation(() => Promise.resolve({ deletedCount: 1 }));

      await expect(
        service.remove('507f1f77bcf86cd799439011'),
      ).resolves.not.toThrow();
    });

    it('should throw a NotFoundException if event not found', async () => {
      jest
        .spyOn(collection, 'deleteOne')
        .mockImplementation(() => Promise.resolve({ deletedCount: 0 }));

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
