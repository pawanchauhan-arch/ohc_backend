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
export class AdminContextInterceptor implements NestInterceptor {
  constructor(private readonly adminService: AuthService) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    if (req.userId && !req.user) {
      const user = await this.adminService.validateAdmin(req.userId);

      if (!user) {
        throw new UnauthorizedException('Admin not authorized');
      }

      req.user = user;
    }

    return next.handle();
  }
}
