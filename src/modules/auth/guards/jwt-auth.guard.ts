import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { User } from '../../../models/User';
import { Role } from '../../../models/Role';
import { configJwt } from '../../../../config/envConfig';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const token = request.cookies?.token;

      if (!token) {
        throw new BadRequestException('Token ID Required');
      }

      let decoded: any;

      try {
        decoded = jwt.verify(token, configJwt.JWT_ADMIN);
      } catch (err: any) {
        if (err.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('JsonWebTokenError');
        }
        if (err.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Token has expired');
        }
        throw new UnauthorizedException('Failed to authenticate token');
      }

      if (!decoded?.data?.id) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // 🔥 IMPORTANT CHANGE
      // DO NOT hit DB here
      // Attach only decoded data
      request['userId'] = decoded.data.id;
      request['user'] = decoded.data;

      return true;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      console.error('JWT Admin Guard Error:', error);
      throw new InternalServerErrorException('Server error');
    }
  }
}
