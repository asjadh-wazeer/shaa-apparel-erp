import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters';
import { TransformResponseInterceptor } from './common/interceptors';
import { JwtAuthGuard } from './common/guards';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  const port = configService.get<number>('app.port', 3001);
  const appName = configService.get<string>('app.name', 'SHAA Apparel ERP');
  const appVersion = configService.get<string>('app.version', '1.0.0');
  const allowedOrigins = configService.get<string[]>('app.allowedOrigins', []);
  const isProduction = configService.get<boolean>('app.isProduction', false);
  const swaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // API versioning
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global guards
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Global interceptors
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger
  if (!isProduction || swaggerEnabled) {
    const swaggerPath = process.env.SWAGGER_PATH ?? 'api/docs';
    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(
        process.env.SWAGGER_DESCRIPTION ?? 'SHAA Apparel ERP REST API',
      )
      .setVersion(appVersion)
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-Tenant-ID', in: 'header' }, 'X-Tenant-ID')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`🚀 ${appName} API running on: http://localhost:${port}/api/v1`);
  if (!isProduction) {
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
