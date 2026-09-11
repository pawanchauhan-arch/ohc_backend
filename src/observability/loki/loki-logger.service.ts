import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createLogger, format, Logger as WinstonLogger, transports } from 'winston';
import LokiTransport = require('winston-loki');

@Injectable()
export class LokiLoggerService implements OnModuleDestroy {
  private readonly logger: WinstonLogger;

  constructor() {
    const lokiUrl = process.env.LOKI_URL || 'http://localhost:3100';
    const appName = process.env.LOKI_APP_NAME || 'mobile_backend';

    this.logger = createLogger({
      level: 'info',
      exitOnError: false,
      format: format.combine(format.timestamp(), format.json()),
      defaultMeta: {
        app: appName,
      },
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp(),
            format.printf(({ timestamp, level, message, context, ...meta }) => {
              const contextPart = context ? ` [${context}]` : '';
              const metaPart = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} ${level.toUpperCase()}${contextPart} ${message}${metaPart}`;
            }),
          ),
        }),
        new LokiTransport({
          host: lokiUrl,
          json: true,
          batching: true,
          interval: 5,
          replaceTimestamp: true,
          clearOnError: false,
          gracefulShutdown: true,
          labels: {
            app: appName,
            stream: 'observability',
          },
          format: format.combine(format.timestamp(), format.json()),
          useWinstonMetaAsLabels: false,
        }),
      ],
    });
  }

  log(message: any, context?: string) {
    this.write('info', this.normalizeMessage(message), this.meta(context, 'info'));
  }

  error(message: any, traceOrMeta?: string | Record<string, any>, context?: string) {
    if (typeof traceOrMeta === 'object' && traceOrMeta !== null) {
      this.write('error', this.normalizeMessage(message), traceOrMeta);
      return;
    }

    this.write('error', this.normalizeMessage(message, typeof traceOrMeta === 'string' ? traceOrMeta : undefined), this.meta(context, 'error'));
  }

  info(message: string, meta: Record<string, any> = {}) {
    this.write('info', message, meta);
  }

  warn(message: any, metaOrContext?: string | Record<string, any>) {
    if (typeof metaOrContext === 'object' && metaOrContext !== null) {
      this.write('warn', this.normalizeMessage(message), metaOrContext);
      return;
    }

    this.write('warn', this.normalizeMessage(message), this.meta(typeof metaOrContext === 'string' ? metaOrContext : undefined, 'warn'));
  }

  debug(message: any, metaOrContext?: string | Record<string, any>) {
    if (typeof metaOrContext === 'object' && metaOrContext !== null) {
      this.write('debug', this.normalizeMessage(message), metaOrContext);
      return;
    }

    this.write('debug', this.normalizeMessage(message), this.meta(typeof metaOrContext === 'string' ? metaOrContext : undefined, 'debug'));
  }

  verbose(message: any, metaOrContext?: string | Record<string, any>) {
    if (typeof metaOrContext === 'object' && metaOrContext !== null) {
      this.write('silly', this.normalizeMessage(message), metaOrContext);
      return;
    }

    this.write('silly', this.normalizeMessage(message), this.meta(typeof metaOrContext === 'string' ? metaOrContext : undefined, 'verbose'));
  }

  onModuleDestroy() {
    this.logger.close();
  }

  private meta(context: string | undefined, level: string) {
    return {
      source: 'nestjs',
      level,
      context: context || undefined,
    };
  }

  private write(level: 'error' | 'warn' | 'info' | 'debug' | 'silly', message: any, meta: Record<string, any> = {}) {
    this.logger.log(
      level,
      JSON.stringify({
        message: typeof message === 'string' ? message : message?.message || 'log',
        ...meta,
      }),
    );
  }

  private normalizeMessage(message: any, trace?: string) {
    if (message instanceof Error) {
      return {
        message: message.message,
        stack: message.stack,
        trace,
      };
    }

    if (typeof message === 'object') {
      return {
        ...message,
        trace,
      };
    }

    return {
      message,
      trace,
    };
  }
}
