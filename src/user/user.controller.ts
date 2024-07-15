import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  NotFoundException,
  Post,
  Res,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UserLoginDto } from './dto/user-login.dto';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('Users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}
  @Post('sign-in')
  @ApiOperation({ summary: 'Login User' })
  async signIn(@Body() body: UserLoginDto, @Res() res: Response): Promise<any> {
    try {
      const user = await this.userService.logIn(body);
      if (user) {
        const payload = {
          name: user.name,
        };
        const access_token = await this.jwtService.signAsync(payload, {
          secret: 'LANDING_JWT_SECRET',
        });
        return res.json({
          messages: 'Sign In Successfully!!!',
          statusCode: HttpStatus.OK,
          access_token: access_token,
        });
      } else {
        throw new NotFoundException('User Does Not Exist');
      }
    } catch (error) {
      throw new BadRequestException('Sign In User Failed !!!', error.message);
    }
  }
}
