import { Injectable, NotFoundException } from '@nestjs/common';
import { Collection, MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { Event } from '../interfaces/event.interface';
import { CollectionDB } from './../constants/index';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  private client: MongoClient;
  private collection: Collection<Event>;

  constructor() {}

  async onModuleInit() {
    try {
      this.client = new MongoClient(process.env.MONGO_DB_URL);
      await this.client.connect();
      this.collection = this.client.db().collection(CollectionDB.EVENT);
    } catch (error) {
      console.error('MongoDB connection error', error);
    }
  }
  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
  }

  async create(createEventDto: CreateEventDto) {
    const id = uuidv4();
    const createdEvent = this.collection.insertOne({ id, ...createEventDto });
    return createdEvent;
  }

  async findAll(
    skip: number,
    limit: number,
    sortBy: 'desc' | 'asc',
  ): Promise<Event[]> {
    return this.collection
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ name: sortBy })
      .toArray();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.collection.findOne({ name: id });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const existingEvent = await this.collection.findOneAndUpdate(
      { name: id },
      { ...updateEventDto },
    );
    if (!existingEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return existingEvent;
  }

  async remove(id: string): Promise<void> {
    const result = await this.collection.findOneAndDelete({ name: id });
    if (result === null) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }
}
