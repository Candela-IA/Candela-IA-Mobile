import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * Módulo global de base de datos.
 *
 * `@Global()` garantiza UNA sola instancia de PrismaService en toda la
 * aplicación. Si cada módulo declarara el provider por su cuenta, NestJS
 * crearía una instancia por módulo — y cada una abre su propio pool de
 * conexiones a MySQL. Con dos módulos se nota poco; con ocho, se agota el
 * límite de conexiones del servidor.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
