import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

import { AuthService } from 'src/modules/auth/auth.service';
@Injectable()
export class CetContextInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();

    if (req.userId && !req.user) {
      const user = await this.authService.validateCet(req.userId);

      if (!user) {
        throw new UnauthorizedException('CET not authorized');
      }

      // role + status checks live here
      if (user.status === false) {
        throw new UnauthorizedException('account_inactive');
      }

      if (user.role?.slug !== 'cet') {
        throw new UnauthorizedException('Invalid Role');
      }

      req.user = user;
    }

    return next.handle();
  }
}
