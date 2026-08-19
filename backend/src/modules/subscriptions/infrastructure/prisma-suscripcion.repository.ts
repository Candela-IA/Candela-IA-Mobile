import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CambioSuscripcion } from '../domain/evento-suscripcion';
import {
  SuscripcionEncontrada,
  SuscripcionRepository,
} from '../domain/suscripcion.repository';

@Injectable()
export class PrismaSuscripcionRepository implements SuscripcionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorDeviceKey(
    deviceKey: string,
  ): Promise<SuscripcionEncontrada | null> {
    const device = await this.prisma.device.findUnique({
      where: { deviceKey },
      select: {
        id: true,
        subscription: { select: { lastEventId: true, lastEventAt: true } },
      },
    });

    if (!device) return null;

    return {
      deviceId: device.id,
      guardado: {
        ultimoEventoId: device.subscription?.lastEventId ?? null,
        ultimoEventoEn: device.subscription?.lastEventAt ?? null,
      },
    };
  }

  /**
   * `upsert` porque la fila de suscripción no existe hasta la primera
   * compra: al registrar el dispositivo solo se crea su saldo de créditos.
   *
   * El estado y las marcas del evento se escriben en la misma sentencia. Si
   * se hicieran en dos pasos y el proceso muriera entre ambos, el evento
   * reintentado se aplicaría por segunda vez sobre un estado ya cambiado.
   */
  async aplicar(
    deviceId: string,
    rcUserId: string,
    cambio: CambioSuscripcion,
  ): Promise<void> {
    const datos = {
      status: cambio.estado,
      plan: cambio.plan,
      expiresAt: cambio.expiraEn,
      lastEventId: cambio.eventoId,
      lastEventAt: cambio.ocurrioEn,
    };

    await this.prisma.subscription.upsert({
      where: { deviceId },
      create: { deviceId, rcUserId, ...datos },
      update: { rcUserId, ...datos },
    });
  }
}
