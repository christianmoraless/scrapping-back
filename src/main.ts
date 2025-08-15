// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   
// }
// bootstrap();


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(json({ limit: '1mb' }));

  const whitelist = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://0.0.0.0:5173',
    'http://0.0.0.0:4000',
    'https://0.0.0.0:4000',
  ];

  app.enableCors({
    origin: whitelist,
    credentials: true,
    allowedHeaders: [
      'Origin',
      'Access-Control-Allow-Origin',
      'X-Requested-With',
      'Accept',
      'Content-Type',
      'Authorization',
    ],
    exposedHeaders: 'Access-Control-Allow-Origin',
    methods: ['GET', 'PUT', 'OPTIONS', 'POST', 'DELETE', 'PATCH'],
    optionsSuccessStatus: 204,
  });

  // // app.setGlobalPrefix('api');

  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  // });
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  await app.listen(process.env.PORT ?? 3000);

}
bootstrap();
