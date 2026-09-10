import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import {
  DomainError,
  LimiteDiarioAlcanzadoError,
} from '../../domain/domain-error';
import {
  GeneracionATopeError,
  GeneracionFallidaError,
  GeneracionRechazadaError,
} from '../../../modules/generation/domain/ai-provider.port';

/**
 * Traduce errores de dominio a respuestas HTTP.
 *
 * Esta es la frontera: el dominio lanza errores que hablan de negocio
 * ("sin créditos", "tono premium") sin saber que existe HTTP, y aquí se
 * convierten en códigos de estado.
 *
 * La app móvil NO debe leer el mensaje para decidir qué hacer — para eso
 * está `codigo`, que es estable. El texto puede cambiar o traducirse.
 */

const CODIGO_A_HTTP: Record<string, HttpStatus> = {
  SIN_CREDITOS: HttpStatus.PAYMENT_REQUIRED, // 402 → la app abre el paywall
  TONO_PREMIUM: HttpStatus.PAYMENT_REQUIRED, // 402 → idem
  LIMITE_DIARIO: HttpStatus.TOO_MANY_REQUESTS, // 429
  TONO_INVALIDO: HttpStatus.BAD_REQUEST,
  IMAGEN_REQUERIDA: HttpStatus.BAD_REQUEST,
  IMAGEN_NO_ESPERADA: HttpStatus.BAD_REQUEST,
  DISPOSITIVO_NO_ENCONTRADO: HttpStatus.UNAUTHORIZED,
};

interface CuerpoError {
  codigo: string;
  mensaje: string;
  reintentable?: boolean;
  /**
   * Cuándo vuelve a estar disponible, en ISO. Solo en LIMITE_DIARIO.
   *
   * Va la fecha y no un texto porque la hora depende de la zona horaria del
   * usuario: el contador se reinicia a medianoche UTC, que en Perú son las 7
   * de la tarde y en México las 6. La app lo formatea con la del teléfono.
   */
  reiniciaEn?: string;
}

@Catch(
  DomainError,
  GeneracionRechazadaError,
  GeneracionFallidaError,
  GeneracionATopeError,
)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(error: Error, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();

    const { estado, cuerpo } = this.traducir(error);

    if (estado >= 500) {
      this.logger.error(`${cuerpo.codigo}: ${error.message}`, error.stack);
    }

    respuesta.status(estado).json(cuerpo);
  }

  private traducir(error: Error): { estado: HttpStatus; cuerpo: CuerpoError } {
    if (error instanceof DomainError) {
      return {
        estado: CODIGO_A_HTTP[error.code] ?? HttpStatus.BAD_REQUEST,
        cuerpo: {
          codigo: error.code,
          mensaje: error.message,
          ...(error instanceof LimiteDiarioAlcanzadoError
            ? { reiniciaEn: error.reiniciaEn.toISOString() }
            : {}),
        },
      };
    }

    // Ritmo, no avería: al usuario le basta con esperar unos segundos, así
    // que merece su propio código y su propio mensaje.
    if (error instanceof GeneracionATopeError) {
      return {
        estado: HttpStatus.TOO_MANY_REQUESTS,
        cuerpo: {
          codigo: 'GENERACION_A_TOPE',
          mensaje: 'Vas muy rápido. Espera unos segundos y vuelve a intentar.',
          reintentable: true,
        },
      };
    }

    if (error instanceof GeneracionRechazadaError) {
      return {
        estado: HttpStatus.UNPROCESSABLE_ENTITY,
        cuerpo: {
          codigo: 'GENERACION_RECHAZADA',
          mensaje:
            'No pude generar una respuesta para esta captura. Prueba con ' +
            'otra imagen u otro modo.',
          reintentable: false,
        },
      };
    }

    // GeneracionFallidaError
    const fallo = error as GeneracionFallidaError;
    return {
      estado: fallo.reintentable
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.INTERNAL_SERVER_ERROR,
      cuerpo: {
        codigo: 'GENERACION_FALLIDA',
        mensaje: fallo.reintentable
          ? 'No pudimos generar la respuesta. Intenta de nuevo.'
          : 'Ocurrió un problema al generar. Ya estamos revisándolo.',
        reintentable: fallo.reintentable,
      },
    };
  }
}
