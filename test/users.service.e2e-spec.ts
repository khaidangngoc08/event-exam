import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoClient, ObjectId } from 'mongodb';
import { UserService } from './../src/user/user.service';

const mockUser = {
  _id: new ObjectId('507f1f77bcf86cd799439011'),
  username: 'testuser',
  password: 'testpassword',
};

describe('UserService', () => {
  let service: UserService;
  let client: MongoClient;
  let db;
  let collection;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        JwtService,
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

    service = module.get<UserService>(UserService);
    client = module.get<MongoClient>(MongoClient);
    db = client.db();
    collection = db.collection('users');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return the user data without password if validation succeeds', async () => {
      jest.spyOn(collection, 'findOne').mockResolvedValue(mockUser);

      const result = await service.validateUser('test_user', 'test_password');

      expect(collection.findOne).toHaveBeenCalledWith({
        username: 'test_user',
      });
      expect(result).toEqual({
        _id: mockUser._id,
        username: mockUser.username,
      });
    });

    it('should return null if validation fails', async () => {
      jest.spyOn(collection, 'findOne').mockResolvedValue(null);

      const result = await service.validateUser('test_user', 'wrong_password');

      expect(collection.findOne).toHaveBeenCalledWith({
        username: 'test_user',
      });
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return a JWT token', async () => {
      const jwtService = new JwtService({
        secret: 'test_secret',
        signOptions: { expiresIn: '60s' },
      });

      const testUser = {
        email: 'testuser@gmail.com',
        password: '507f1f77bcf86cd799439011',
      };

      jest.spyOn(jwtService, 'sign').mockReturnValue('test_token');

      const service = new UserService();

      const result = await service.logIn(testUser);

      expect(result).toEqual({
        access_token: 'test_token',
      });
    });
  });
});
