import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Única puerta de entrada a la base de datos.
 *
 * Los repositorios de cada módulo lo inyectan; nada más en la aplicación
 * habla con Prisma directamente.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Conectado a MySQL');
    } catch (e) {
      this.logger.error(
        'No pude conectar a MySQL. Revisa DATABASE_URL en el .env y que el ' +
          'servicio esté corriendo.',
      );
      throw e;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
