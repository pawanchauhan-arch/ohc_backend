import { Injectable, NestMiddleware } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  private getStatusClass(statusCode: number): string {
    if (statusCode >= 100 && statusCode < 200) {
      return '1xx';
    }
    if (statusCode >= 200 && statusCode < 300) {
      return '2xx';
    }
    if (statusCode >= 300 && statusCode < 400) {
      return '3xx';
    }
    if (statusCode >= 400 && statusCode < 500) {
      return '4xx';
    }
    return '5xx';
  }

  private getRouteLabel(req: any): string {
    const routePath = req.route?.path;
    const baseUrl = req.baseUrl || '';

    if (routePath) {
      const normalizedRoute = `${baseUrl}${routePath}`;
      return normalizedRoute.startsWith('/') ? normalizedRoute : `/${normalizedRoute}`;
    }

    if (req.originalUrl) {
      return req.originalUrl.split('?')[0];
    }

    return req.url || 'unknown';
  }

  use(req: any, res: any, next: () => void) {
    const start = process.hrtime.bigint();
    let recorded = false;

    const recordMetrics = () => {
      if (recorded) {
        return;
      }
      recorded = true;

      const route = this.getRouteLabel(req);
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000_000;
      const statusCode = Number(res.statusCode || 500);
      const status = String(statusCode);
      const statusClass = this.getStatusClass(statusCode);

      this.metricsService.requestCounter.inc({
        method: req.method,
        route,
        status,
        status_class: statusClass,
      });

      this.metricsService.requestDuration.observe(
        {
          method: req.method,
          route,
          status,
          status_class: statusClass,
        },
        duration,
      );
    };

    res.once('finish', recordMetrics);
    res.once('close', recordMetrics);

    next();
  }
}
