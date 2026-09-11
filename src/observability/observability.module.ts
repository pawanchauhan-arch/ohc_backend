import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics/metrics.service';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { MetricsMiddleware } from './middleware/metrics.middleware';
import { LokiLoggerService } from './loki/loki-logger.service';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    MetricsService,
    MetricsInterceptor,
    GlobalExceptionFilter,
    MetricsMiddleware,
    LokiLoggerService,
  ],
  exports: [MetricsService, MetricsInterceptor, GlobalExceptionFilter, MetricsMiddleware, LokiLoggerService],
})
export class ObservabilityModule {}
