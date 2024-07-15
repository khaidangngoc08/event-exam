import { BadRequestException, Injectable } from '@nestjs/common';
import { compareSync } from 'bcryptjs';
import { Collection, MongoClient } from 'mongodb';
import { UserLoginDto } from 'src/user/dto/user-login.dto';
import { User } from '../interfaces/user.interface';
import { CollectionDB } from './../constants/index';

@Injectable()
export class UserService {
  private client: MongoClient;
  private collection: Collection<User>;

  constructor() {}

  async onModuleInit() {
    try {
      this.client = new MongoClient(process.env.MONGO_DB_URL);
      await this.client.connect();
      this.collection = this.client.db().collection(CollectionDB.USER);
    } catch (error) {
      console.error('MongoDB connection error', error);
    }
  }
  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
  }

  async logIn(body: UserLoginDto): Promise<User> {
    const user = await this.collection.findOne({
      where: { email: body.email },
    });
    if (!user) {
      throw new BadRequestException('Incorrect email or password');
    }
    const isPasswordMatching = compareSync(body.password, user.password);
    if (!isPasswordMatching) {
      throw new BadRequestException('Incorrect email or password.');
    }
    return user;
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.collection.findOne({ username });
    if (user && compareSync(user.password, pass)) {
      return user;
    }
    return null;
  }
}
