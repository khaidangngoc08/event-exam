import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

@Injectable()
export class JWTMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}
  async use(req: Request, res: Response, next: () => any) {
    const token = this.extractTokenFromHeader(req);
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.LANDING_JWT_SECRET || 'LANDING_JWT_SECRET',
        });
        req['user'] = payload;
      } catch (err) {
        throw new UnauthorizedException();
      }
    } else {
      throw new UnauthorizedException();
    }
    next?.();
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const [type, token] = req.headers['authorization'].split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
