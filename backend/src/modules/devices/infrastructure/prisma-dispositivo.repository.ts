import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { DispositivoNoEncontradoError } from '../../../shared/domain/domain-error';
import {
  CreditBalance,
  DIAS_RENOVACION_GRATIS,
} from '../../credits/domain/credit-balance';
import {
  DatosSuscripcion,
  Dispositivo,
  EstadoSuscripcion,
  Plataforma,
} from '../domain/dispositivo.aggregate';
import {
  DatosRegistro,
  DispositivoRepository,
} from '../domain/dispositivo.repository';

/** Trae el agregado completo en una sola consulta. */
const CON_RELACIONES = {
  credits: true,
  subscription: true,
} satisfies Prisma.DeviceInclude;

type FilaDispositivo = Prisma.DeviceGetPayload<{ include: typeof CON_RELACIONES }>;

@Injectable()
export class PrismaDispositivoRepository implements DispositivoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async registrarORecuperar(datos: DatosRegistro): Promise<Dispositivo> {
    const ahora = new Date();

    // upsert es la clave de la idempotencia: si el dispositivo ya existe
    // (reinstaló la app), solo actualizamos la versión y devolvemos su saldo
    // intacto. Nunca reinicia los 5 gratis.
    const fila = await this.prisma.device.upsert({
      where: { deviceKey: datos.deviceKey },
      create: {
        deviceKey: datos.deviceKey,
        platform: datos.plataforma,
        appVersion: datos.appVersion,
        credits: {
          create: {
            freeUsed: 0,
            freeResetAt: siguienteRenovacion(ahora),
            dailyUsed: 0,
            dailyResetAt: siguienteMedianoche(ahora),
          },
        },
        subscription: { create: { status: 'NONE' } },
      },
      update: { appVersion: datos.appVersion },
      include: CON_RELACIONES,
    });

    return this.aDominio(fila);
  }

  async buscarPorId(id: string): Promise<Dispositivo | null> {
    const fila = await this.prisma.device.findUnique({
      where: { id },
      include: CON_RELACIONES,
    });

    return fila ? this.aDominio(fila) : null;
  }

  /**
   * Bloquea la fila del saldo antes de leerla, aplica la regla de dominio y
   * escribe — todo dentro de la misma transacción.
   *
   * Sin el bloqueo, dos toques rápidos a "Generar otra respuesta" pueden
   * leer el mismo saldo, cada uno creer que le quedaban créditos, y gastar
   * uno solo por dos generaciones. A escala pequeña parece improbable; con
   * conexión lenta y doble toque, pasa.
   */
  async consumirCredito(id: string, ahora: Date): Promise<Dispositivo> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT id FROM credit_balances WHERE deviceId = ${id} FOR UPDATE
      `;

      const fila = await tx.device.findUnique({
        where: { id },
        include: CON_RELACIONES,
      });

      if (!fila) throw new DispositivoNoEncontradoError();

      const dispositivo = this.aDominio(fila);

      // Si no corresponde, esto lanza y la transacción se revierte sola.
      dispositivo.consumirCredito(ahora);

      const estado = dispositivo.creditos.aPersistencia();
      await tx.creditBalance.update({
        where: { deviceId: id },
        data: {
          freeUsed: estado.freeUsed,
          freeResetAt: estado.freeResetAt,
          dailyUsed: estado.dailyUsed,
          dailyResetAt: estado.dailyResetAt,
          lifetimeUsed: estado.lifetimeUsed,
        },
      });

      return dispositivo;
    });
  }

  async devolverCredito(id: string, ahora: Date): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT id FROM credit_balances WHERE deviceId = ${id} FOR UPDATE
      `;

      const fila = await tx.device.findUnique({
        where: { id },
        include: CON_RELACIONES,
      });

      if (!fila) return;

      const dispositivo = this.aDominio(fila);
      dispositivo.devolverCredito(ahora);

      const estado = dispositivo.creditos.aPersistencia();
      await tx.creditBalance.update({
        where: { deviceId: id },
        data: {
          freeUsed: estado.freeUsed,
          freeResetAt: estado.freeResetAt,
          dailyUsed: estado.dailyUsed,
          lifetimeUsed: estado.lifetimeUsed,
        },
      });
    });
  }

  // ── Traducción persistencia → dominio ───────────────────────────────────

  private aDominio(fila: FilaDispositivo): Dispositivo {
    const ahora = new Date();

    const creditos = fila.credits
      ? CreditBalance.desdePersistencia({
          freeUsed: fila.credits.freeUsed,
          // Las filas anteriores a los créditos semanales no traen fecha de
          // renovación. Se les da una ya vencida, así estrenan sus intentos
          // la próxima vez que abran la app, en vez de arrastrar para siempre
          // los que gastaron con la regla vieja.
          freeResetAt: fila.credits.freeResetAt ?? new Date(0),
          dailyUsed: fila.credits.dailyUsed,
          dailyResetAt: fila.credits.dailyResetAt,
          lifetimeUsed: fila.credits.lifetimeUsed,
        })
      : CreditBalance.nuevo(ahora);

    const suscripcion: DatosSuscripcion = {
      estado: (fila.subscription?.status ??
        EstadoSuscripcion.NONE) as EstadoSuscripcion,
      expiraEn: fila.subscription?.expiresAt ?? null,
    };

    return new Dispositivo(
      fila.id,
      fila.deviceKey,
      fila.platform as Plataforma,
      creditos,
      suscripcion,
    );
  }
}

function siguienteMedianoche(ahora: Date): Date {
  const siguiente = new Date(ahora);
  siguiente.setUTCHours(24, 0, 0, 0);
  return siguiente;
}

/**
 * Igual que `siguienteRenovacion` del dominio: siete días desde hoy, a
 * medianoche.
 *
 * Se duplica aquí, como ya se hacía con `siguienteMedianoche`, para que la
 * fila se pueda crear en el mismo `upsert` sin construir antes el agregado.
 */
function siguienteRenovacion(ahora: Date): Date {
  const siguiente = new Date(ahora);
  siguiente.setUTCHours(24, 0, 0, 0);
  siguiente.setUTCDate(siguiente.getUTCDate() + DIAS_RENOVACION_GRATIS - 1);
  return siguiente;
}
