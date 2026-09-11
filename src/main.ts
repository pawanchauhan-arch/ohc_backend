import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { TenantInterceptor } from './common/tenant/tenant.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './observability/filters/global-exception.filter';
import { LokiLoggerService } from './observability/loki/loki-logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));
  const lokiLogger = app.get(LokiLoggerService);
  const originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };

  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    lokiLogger.info(
      args.length === 1 ? String(args[0]) : JSON.stringify(args),
      { source: 'console', level: 'info' },
    );
  };

  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    lokiLogger.info(
      args.length === 1 ? String(args[0]) : JSON.stringify(args),
      { source: 'console', level: 'info' },
    );
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    lokiLogger.warn(
      args.length === 1 ? String(args[0]) : JSON.stringify(args),
      { source: 'console', level: 'warn' },
    );
  };

  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    lokiLogger.error(
      args.length === 1 ? String(args[0]) : JSON.stringify(args),
      { source: 'console', level: 'error' },
    );
  };

  console.debug = (...args: any[]) => {
    originalConsole.debug(...args);
    lokiLogger.debug(
      args.length === 1 ? String(args[0]) : JSON.stringify(args),
      { source: 'console', level: 'debug' },
    );
  };

  app.useLogger(lokiLogger);

  if (process.env.isStaging === '1') {
    lokiLogger.info('Staging mode', { source: 'startup', level: 'info' });
  }

  app.useGlobalFilters(app.get(GlobalExceptionFilter));

  app.enableShutdownHooks();

  app.use(cookieParser());

  app.enableCors({
    origin: '*', // restrict later
    credentials: true,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders:
      'Content-Type, Authorization, Cache-Control, Pragma, Expires, X-Requested-With',
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // ✅ Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ✅ Tenant
  app.useGlobalInterceptors(new TenantInterceptor());

  await app.listen(process.env.PORT);
}
bootstrap();
