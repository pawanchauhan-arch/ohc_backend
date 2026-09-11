import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LokiLoggerService } from '../loki/loki-logger.service';

@Catch()
export class GlobalExceptionFilter
  implements ExceptionFilter
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

  catch(exception: any, host: ArgumentsHost) {
    const ctx =
      host.switchToHttp();

    const req = ctx.getRequest();
    const res = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.lokiLoggerService.error('http_exception', {
      method: req.method,
      route: this.getRouteLabel(req),
      status,
      message: exception?.message,
      stack: exception?.stack,
      source: 'exception',
      level: 'error',
    });

    if (res.headersSent) {
      return;
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      res.status(status).json(
        typeof response === 'string'
          ? { statusCode: status, message: response }
          : response,
      );
      return;
    }

    res.status(status).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}
