import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Candela');

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta cualquier campo que no esté declarado en el DTO.
      whitelist: true,
      // Y si llega uno de más, rechaza la petición en vez de ignorarla en
      // silencio: prefiero un error claro a un comportamiento raro.
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // La app móvil no es un navegador, así que CORS solo hace falta para que
  // la propia página de Swagger pueda ejecutar peticiones.
  app.enableCors({ origin: true });

  // Las capturas viajan en base64: el cuerpo por defecto de 100kb no alcanza.
  const { json, urlencoded } = await import('express');
  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ extended: true, limit: '12mb' }));

  const config = new DocumentBuilder()
    .setTitle('Candela IA')
    .setDescription(
      'API de Candela IA.\n\n' +
        '**Privacidad:** las capturas se procesan en memoria y se descartan. ' +
        'No se almacena ninguna imagen ni el texto de las conversaciones.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'dispositivo',
    )
    .build();

  const documento = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documento, {
    swaggerOptions: { persistAuthorization: true },
  });

  const puerto = process.env.PORT ?? 3000;
  await app.listen(puerto);

  logger.log(`API      → http://localhost:${puerto}/api/v1`);
  logger.log(`Swagger  → http://localhost:${puerto}/api/docs`);
}

void bootstrap();
