import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static uploads
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 6001);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const rawOrigins = [
    configService.get<string>('ALLOWED_ORIGINS', ''),
    configService.get<string>('CLIENT_URL', ''),
    configService.get<string>('FRONTEND_URL', ''),
  ]
    .filter(Boolean)
    .join(',');

  const configuredOrigins = rawOrigins
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://www.saisaa.com',
    'https://saisaa.com',
    'http://www.saisaa.com',
    'http://saisaa.com',
  ];

  const allowedOrigins = Array.from(
    new Set([...configuredOrigins, ...defaultOrigins]),
  );

  // 1. Enable Cross-Origin Resource Sharing (CORS)
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      const isAllowed =
        allowedOrigins.includes(cleanOrigin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin) ||
        /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*saisaa\.com$/.test(cleanOrigin);

      if (isAllowed) {
        return callback(null, true);
      }
      logger.warn(`CORS blocked for origin: ${origin}`);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. Set Global API URL Prefix (e.g. /api/v1)
  app.setGlobalPrefix(apiPrefix);

  // 3. Global Input Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Global Unified Response Interceptor
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));

  // 5. Global Unified Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // 6. Start HTTP Server
  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(`🚀 SAISAA NestJS Backend is running on port: ${port}`);
  logger.log(`🔗 API Base URL: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🩺 Health Check: http://localhost:${port}/${apiPrefix}/health`);
  logger.log(`=======================================================`);
}

bootstrap();
