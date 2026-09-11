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
export class JwtCetGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const token =
        request.cookies?.cet_token || (request.headers['authkey'] as string);

      if (!token) {
        throw new BadRequestException('Token Required');
      }

      let decoded: any;

      try {
        decoded = jwt.verify(token, configJwt.JWT_CENTER);
      } catch (err: any) {
        if (err.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('JsonWebTokenError');
        }
        if (err.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Token has expired');
        }
        throw new UnauthorizedException('Failed to authenticate token');
      }

      // ✅ ONLY minimal validation
      if (!decoded?.data?.id) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Optional expiry check (jwt.verify already does this)
      if (decoded.exp <= Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token has expired');
      }

      // ✅ Attach only IDs
      request['userId'] = decoded.data.id;
      request['cetId'] = decoded.data.cet_id ?? null;

      return true;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      console.error('JWT CET Guard Error:', error);
      throw new InternalServerErrorException('Server error');
    }
  }
}
