import { timingSafeEqual } from 'node:crypto';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Deja pasar solo a RevenueCat.
 *
 * En el panel de RevenueCat se configura una cabecera `Authorization` con un
 * valor secreto, y aquí se comprueba que coincida. Sin esto, la URL del
 * webhook es un endpoint público que regala suscripciones a quien adivine
 * el formato del JSON.
 *
 * Dos detalles que no son adorno:
 *
 * 1. La comparación es de tiempo constante. Un `===` normal termina en el
 *    primer carácter distinto, y ese tiempo distinto permite adivinar el
 *    secreto carácter a carácter.
 *
 * 2. Si el secreto no está configurado, se rechaza TODO. Lo contrario
 *    —dejar pasar mientras no haya secreto— convierte un despiste al
 *    desplegar en una puerta abierta que nadie nota.
 */
@Injectable()
export class RevenueCatGuard implements CanActivate {
  private readonly logger = new Logger(RevenueCatGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(contexto: ExecutionContext): boolean {
    const secreto = this.config.get<string>('REVENUECAT_WEBHOOK_SECRET');

    if (!secreto) {
      this.logger.error(
        'REVENUECAT_WEBHOOK_SECRET no está configurado: el webhook rechaza ' +
          'todo. Ponlo en el .env y en el panel de RevenueCat.',
      );
      throw new UnauthorizedException();
    }

    const peticion = contexto.switchToHttp().getRequest<Request>();
    const recibido = peticion.header('authorization');

    if (!recibido || !iguales(recibido, secreto)) {
      this.logger.warn(
        `Webhook rechazado desde ${peticion.ip ?? 'origen desconocido'}.`,
      );
      throw new UnauthorizedException();
    }

    return true;
  }
}

function iguales(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  // `timingSafeEqual` exige la misma longitud. Comparar antes revela el
  // largo del secreto, que es una filtración mínima y aceptable: sin esto
  // la función lanza en vez de devolver false.
  if (bufferA.length !== bufferB.length) return false;

  return timingSafeEqual(bufferA, bufferB);
}
