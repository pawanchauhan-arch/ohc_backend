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
export class JwtAdminGuardB2C implements CanActivate {
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

      request['userId'] = decoded.data.id;
      request['user'] = decoded.data;
      request['tenantId'] = decoded.data.tenantId;
      request['role'] = decoded.data.role;
      request['centerId'] = decoded.data.centerId || null;
      // TODO: need to implement
      // request['permissions']=(decoded.data.p || [])
      //     .map((id: number) => getPermissionsMap()[id])
      //     .filter(Boolean),
      //       };
      return true;
    } catch (error: any) {
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
