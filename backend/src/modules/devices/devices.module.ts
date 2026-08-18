import { Module } from '@nestjs/common';

import { AuthModule } from '../../shared/infrastructure/auth/auth.module';
import { DISPOSITIVO_REPO } from './domain/dispositivo.repository';
import { PrismaDispositivoRepository } from './infrastructure/prisma-dispositivo.repository';
import { DispositivosController } from './infrastructure/http/dispositivos.controller';

@Module({
  imports: [AuthModule],
  controllers: [DispositivosController],
  providers: [
    // Aquí se conecta el puerto con su adaptador. Cambiar de MySQL a otra
    // cosa sería sustituir esta clase; nada más se entera.
    { provide: DISPOSITIVO_REPO, useClass: PrismaDispositivoRepository },
  ],
  exports: [DISPOSITIVO_REPO],
})
export class DevicesModule {}
