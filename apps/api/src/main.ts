import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(__dirname, '../../../.env'), quiet: true });
config({ quiet: true });
import { Module, ForbiddenException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express from 'express';
import { HealthModule } from './health/health.module';
import { databaseOptions } from './database';
import { Store } from './store';
import { LocalPhotoStorage, PhotosService } from './photos';
import { AuthService } from './auth';
import { StallsService, ProductsService } from './products';
import { AppController } from './http';
import { describeApi } from './openapi';
import { OrdersController, OrdersService } from './orders';
import { PersistenceModule, AccessModule, PhotosModule, CatalogModule } from './modules';
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    HealthModule,
    PersistenceModule,
    AccessModule,
    PhotosModule,
    CatalogModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: process.env.NODE_ENV === 'test' ? 1000 : 60 }]),
  ],
  controllers: [AppController, OrdersController],
  providers: [OrdersService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
class AppModule {}
export async function createApp() {
  if (
    process.env.NODE_ENV === 'production' &&
    (process.env.AUTH_PROVIDER !== 'cognito' ||
      !process.env.ADMIN_KEY ||
      process.env.ADMIN_KEY.length < 32 ||
      !process.env.COGNITO_CLIENT_ID ||
      !process.env.COGNITO_USER_POOL_ID ||
      !process.env.APP_ORIGIN?.startsWith('https://'))
  )
    throw new Error('Configuração de produção incompleta. Consulte README.');
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'test' ? false : ['error', 'warn', 'log'],
  });
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.use((req: any, _res: any, next: any) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.headers.origin &&
      req.headers.origin !== (process.env.APP_ORIGIN || 'http://127.0.0.1:5173')
    )
      return _res.status(403).json({ statusCode: 403, message: 'Origem não permitida.' });
    next();
  });
  app.enableCors({ origin: process.env.APP_ORIGIN || 'http://127.0.0.1:5173', credentials: true });
  app.use(
    '/uploads',
    express.static(resolve(process.cwd(), 'uploads'), {
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=86400');
      },
    }),
  );
  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Caxi · ERP da barraca')
      .setDescription(
        'Sessão por cookie; mutações autenticadas exigem X-CSRF-Token retornado por /auth/session. Modo demo nunca permitido em produção.',
      )
      .setVersion('1.0')
      .addCookieAuth('caxi_session', { type: 'apiKey' }, 'cookie')
      .addApiKey({ type: 'apiKey', in: 'header', name: 'X-CSRF-Token' }, 'csrf')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, describeApi(doc));
  await app.init();
  return app;
}
if (require.main === module)
  createApp()
    .then((app) => app.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1'))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
