import { Module } from '@nestjs/common';

import { ProcesarEventoUseCase } from './application/procesar-evento.use-case';
import { SUSCRIPCION_REPO } from './domain/suscripcion.repository';
import { PrismaSuscripcionRepository } from './infrastructure/prisma-suscripcion.repository';
import { RevenueCatController } from './infrastructure/http/revenuecat.controller';

@Module({
  controllers: [RevenueCatController],
  providers: [
    ProcesarEventoUseCase,
    { provide: SUSCRIPCION_REPO, useClass: PrismaSuscripcionRepository },
  ],
})
export class SubscriptionsModule {}
