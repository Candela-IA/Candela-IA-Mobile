import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { validarEntorno } from './config/entorno';
import { DomainExceptionFilter } from './shared/infrastructure/http/domain-exception.filter';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { SaludController } from './shared/infrastructure/http/salud.controller';
import { DevicesModule } from './modules/devices/devices.module';
import { GenerationModule } from './modules/generation/generation.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    /**
     * `validate` corre antes que ningún módulo: si falta algo esencial, el
     * proceso muere aquí con un mensaje claro en vez de arrancar a medias y
     * fallar más tarde disfrazado de otra cosa. Ver `config/entorno.ts`.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validarEntorno,
    }),

    /**
     * Límite base por IP: protege contra fuerza bruta y scraping.
     * Es distinto del tope de créditos por dispositivo — ese vive en el
     * dominio y es una regla de negocio, no de infraestructura.
     */
    ThrottlerModule.forRoot([
      { name: 'corto', ttl: 1_000, limit: 5 },
      { name: 'largo', ttl: 60_000, limit: 60 },
    ]),

    // Global: una sola instancia de PrismaService para toda la aplicación.
    PrismaModule,
    DevicesModule,
    GenerationModule,
    SubscriptionsModule,
  ],
  controllers: [SaludController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Traduce los errores de dominio a códigos HTTP en toda la aplicación.
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
