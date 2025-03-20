import {
  ClassSerializerInterceptor,
  HttpStatus,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from './app.module';

const bootstrap = async () => {
  const httpsOptions = {
    key: fs.readFileSync('./secrets/cert.key'),
    cert: fs.readFileSync('./secrets/cert.crt'),
  };

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
    httpsOptions,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
    defaultVersion: '1',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Bula API')
    .setDescription('Bula API')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(`/api/v:version/docs`, app, document, {
    swaggerOptions: {
      apiSorter: 'alpha',
      tagsSorter: 'alpha',
      operationSorter: 'alpha',
    },
  });

  const configService = app.get<ConfigService>(ConfigService);

  app.enableCors({
    origin: configService.getOrThrow('corsOrigin'),
    methods: [
      'GET',
      'HEAD',
      'PUT',
      'PATCH',
      'POST',
      'DELETE',
      'UPDATE',
      'OPTIONS',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: HttpStatus.NO_CONTENT,
  });

  await app.listen(configService.getOrThrow('apiPort'));
};

bootstrap();
