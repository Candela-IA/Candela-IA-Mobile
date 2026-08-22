import {
  INestApplication,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Candela');

  /**
   * Detrás de un proxy (Railway, Render, Fly) todas las peticiones llegan
   * desde la IP del proxy. Sin esto, el limitador vería a TODOS los usuarios
   * como uno solo y bloquearía a la app entera al superar 60 peticiones por
   * minuto entre todos.
   *
   * El 1 es el número de saltos de confianza: solo el proxy de la
   * plataforma, no cualquiera que mande una cabecera X-Forwarded-For.
   */
  app.set('trust proxy', 1);

  /**
   * Al desplegar, la plataforma manda SIGTERM y espera. Con los hooks
   * activados, Nest cierra los módulos en orden y Prisma suelta sus
   * conexiones; sin ellos el proceso muere de golpe y MySQL se queda con
   * conexiones colgadas hasta que expiran.
   */
  app.enableShutdownHooks();

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

  const enProduccion = process.env.NODE_ENV === 'production';

  // Las capturas viajan en base64: el cuerpo por defecto de 100kb no alcanza.
  const { json, urlencoded } = await import('express');
  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ extended: true, limit: '12mb' }));

  // Swagger describe la API entera: qué endpoints hay, qué aceptan y qué
  // errores devuelven. Es justo lo que necesitaría alguien para atacarla,
  // así que en producción no se publica salvo que se pida a propósito.
  if (!enProduccion || process.env.SWAGGER === 'true') {
    montarSwagger(app);
  }

  const puerto = process.env.PORT ?? 3000;
  await app.listen(puerto, '0.0.0.0');

  logger.log(`API      → http://localhost:${puerto}/api/v1`);
  logger.log(`Estado   → http://localhost:${puerto}/api/v1/salud`);
  if (!enProduccion) {
    logger.log(`Swagger  → http://localhost:${puerto}/api/docs`);
  }
}

function montarSwagger(app: INestApplication): void {
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
}

void bootstrap();
