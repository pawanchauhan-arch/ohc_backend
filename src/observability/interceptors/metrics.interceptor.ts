import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metricsService: MetricsService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const start = process.hrtime.bigint();
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const route = req.route?.path || req.originalUrl || req.url || 'unknown';

    this.metricsService.requestInProgress.inc({
      method: req.method,
      route,
    });

    return next.handle().pipe(
      tap(() => {
        const duration = Number(process.hrtime.bigint() - start) / 1_000_000_000;
        const status = String(res.statusCode || 200);

        this.metricsService.requestCounter.inc({
          method: req.method,
          route,
          status,
        });

        this.metricsService.requestDuration.observe(
          {
            method: req.method,
            route,
            status,
          },
          duration,
        );
      }),
      catchError((error) => {
        const duration = Number(process.hrtime.bigint() - start) / 1_000_000_000;
        const status = String(error?.status || res.statusCode || 500);

        this.metricsService.requestCounter.inc({
          method: req.method,
          route,
          status,
        });

        this.metricsService.requestDuration.observe(
          {
            method: req.method,
            route,
            status,
          },
          duration,
        );

        return throwError(() => error);
      }),
      finalize(() => {
        this.metricsService.requestInProgress.dec({
          method: req.method,
          route,
        });
      }),
    );
  }
}
