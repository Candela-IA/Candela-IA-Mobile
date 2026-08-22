import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../prisma/prisma.service';

/**
 * ESTADO DEL SERVICIO
 *
 * Railway —y cualquier plataforma de despliegue— consulta un endpoint como
 * este cada pocos segundos para decidir si el contenedor está sano. Si
 * responde mal, reinicia; si responde bien durante un despliegue nuevo,
 * corta el tráfico del viejo y pasa al nuevo.
 *
 * Comprueba la base de datos a propósito. Un backend que arranca pero no
 * puede consultar MySQL está roto para todo lo que importa, y decir "ok"
 * ahí haría que la plataforma lo diera por bueno y mandara usuarios a un
 * servicio que va a fallarles.
 */
@ApiTags('Estado')
@Controller({ path: 'salud', version: '1' })
export class SaludController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  // Sin límite de peticiones: la plataforma consulta esto constantemente y
  // un 429 se leería como servicio caído.
  @SkipThrottle()
  @ApiOperation({
    summary: 'Estado del servicio',
    description:
      'Responde 200 si la API y la base de datos están operativas, y 503 ' +
      'si la base no responde. Lo consulta la plataforma de despliegue.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        estado: 'ok',
        baseDatos: 'ok',
        version: '1.0.0',
        activoDesdeSegundos: 3812,
      },
    },
  })
  async consultar(): Promise<{
    estado: string;
    baseDatos: string;
    version: string;
    activoDesdeSegundos: number;
  }> {
    try {
      // La consulta más barata posible: confirma que la conexión vive sin
      // tocar ninguna tabla ni cargar datos.
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        estado: 'error',
        baseDatos: 'sin conexión',
      });
    }

    return {
      estado: 'ok',
      baseDatos: 'ok',
      version: process.env.npm_package_version ?? '0.0.0',
      activoDesdeSegundos: Math.round(process.uptime()),
    };
  }
}
