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
export class AdminCenterContextInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();

    // Skip test account
    if (req.isTestAccount) {
      req.user = { id: req.userId, isTestAccount: true };
      return next.handle();
    }

    if (req.userId && !req.user) {
      const user = await this.authService.validateCet(req.userId);

      if (!user) {
        throw new UnauthorizedException('User not authorized');
      }

      if (user.status === false) {
        throw new UnauthorizedException('account_inactive');
      }

      if (!user.role || user.role.slug !== 'center') {
        throw new UnauthorizedException('Invalid Role or account deactivate');
      }

      req.user = user;
    }

    return next.handle();
  }
}

