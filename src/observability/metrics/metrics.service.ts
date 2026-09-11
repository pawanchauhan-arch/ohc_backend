import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly requestCounter: Counter<string>;

  public readonly requestDuration: Histogram<string>;

  public readonly requestInProgress: Gauge<string>;

  constructor() {
    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests.',
      labelNames: ['method', 'route', 'status', 'status_class'],
    });

    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds.',
      labelNames: ['method', 'route', 'status', 'status_class'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.requestInProgress = new Gauge({
      name: 'http_requests_in_progress',
      help: 'Current number of in-flight HTTP requests.',
      labelNames: ['method', 'route'],
    });
  }
}
