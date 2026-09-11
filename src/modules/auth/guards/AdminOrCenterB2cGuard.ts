import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAdminGuardB2C } from './jwt-b2c-auth.guard';
import { JwtAdminGuardCenterB2C } from './jwtCenterb2c-auth.guard';

@Injectable()
export class AdminOrCenterGuardB2C implements CanActivate {
  constructor(
    private readonly adminGuard: JwtAdminGuardB2C,
    private readonly centerGuard: JwtAdminGuardCenterB2C,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const guards = [this.adminGuard, this.centerGuard];

    for (const guard of guards) {
      try {
        const result = await guard.canActivate(context);
        if (result) return true;
      } catch (err) {
        // Ignore and try next guard
      }
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
