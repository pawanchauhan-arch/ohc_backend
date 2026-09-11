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
import { sendError } from '../../../utils/response.util';
@Injectable()
export class JwtAdminGuardCenterB2C implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const authHeader = request.headers['authorization'];
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

      if (!token) {
        throw new BadRequestException('Token ID Required');
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

      if (!decoded?.data?.id) {
        throw new UnauthorizedException('Invalid token payload');
      }

      if (decoded.exp <= Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token has expired');
      }

      // ✅ Special test account bypass
      if (decoded.data.id === 999999) {
        request['userId'] = decoded.data.id;
        request['isTestAccount'] = true;
        return true; // allow
      }

      // ✅ Attach ID only, DB validation moved to interceptor
      request['userId'] = decoded.data.id;

      return true;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      console.error('JWT Admin Guard Center Error:', error);
      throw new InternalServerErrorException('Server error');
    }
  }
}
