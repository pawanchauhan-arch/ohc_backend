import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAdminGuard } from './jwt-auth.guard';
import { JwtAdminGuardCenter } from './jwtCenter-auth.guard';

@Injectable()
export class AdminOrCenterGuard implements CanActivate {
  constructor(
    private readonly adminGuard: JwtAdminGuard,
    private readonly centerGuard: JwtAdminGuardCenter,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const adminResult = await this.adminGuard.canActivate(context);
      if (adminResult) {
        request['isAdminCaller'] = true;
        return true;
      }
    } catch (err) {
      // Fall through to center guard
    }
    try {
      const centerResult = await this.centerGuard.canActivate(context);
      if (centerResult) {
        return true;
      }
    } catch (err) {
      // Both guards failed
    }
    throw new UnauthorizedException('Unauthorized');
  }
}
