import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { LokiLoggerService } from '../loki/loki-logger.service';

@Injectable()
export class RequestLoggerMiddleware
  implements NestMiddleware
{
  constructor(private readonly lokiLoggerService: LokiLoggerService) {}

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

  use(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
      const duration =
        Date.now() - start;

      const payload = {
          method: req.method,
          route: this.getRouteLabel(req),
          statusCode: res.statusCode,
          duration,
      };

      this.lokiLoggerService.info('http_request', {
        ...payload,
        source: 'request',
        level: 'info',
      });
    });

    next();
  }
}
