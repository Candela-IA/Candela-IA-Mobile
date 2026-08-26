import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  Dispositivo,
  GuardDispositivo,
} from '../../../../shared/infrastructure/auth/auth.module';
import { DispositivoAutenticado } from '../../../../shared/infrastructure/auth/jwt.strategy';
import { GenerarRespuestaUseCase } from '../../application/generar-respuesta.use-case';
import { GenerarDto, RespuestaGeneradaDto } from './dto/generar.dto';

@ApiTags('Generación')
@Controller({ path: 'generar', version: '1' })
export class GenerarController {
  constructor(private readonly generar: GenerarRespuestaUseCase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(GuardDispositivo)
  @ApiBearerAuth('dispositivo')
  // Más estricto que el límite global: cada llamada cuesta dinero real.
  @Throttle({ corto: { ttl: 10_000, limit: 3 } })
  @ApiOperation({
    summary: 'Generar un mensaje',
    description:
      'Único endpoint para las cuatro funciones. Qué pide cada una lo dice ' +
      '`GET /catalogo`:\n\n' +
      '- **ANALIZAR_CHAT** y **ANALIZAR_STORIES** → requieren `imagen`\n' +
      '- **ROMPEHIELOS** y **CREAR_NOTAS** → no aceptan `imagen`\n\n' +
      'Consume **un crédito por llamada**, incluidas las regeneraciones. Si ' +
      'la IA falla, el crédito se devuelve automáticamente.\n\n' +
      '**Privacidad:** la imagen se procesa en memoria y se descarta. No se ' +
      'almacena en ningún momento.',
  })
  @ApiOkResponse({ type: RespuestaGeneradaDto })
  @ApiResponse({
    status: HttpStatus.PAYMENT_REQUIRED,
    description:
      'Sin créditos (`SIN_CREDITOS`) o tono premium sin suscripción ' +
      '(`TONO_PREMIUM`). En ambos casos la app debe abrir el paywall.',
  })
  @ApiBadRequestResponse({
    description:
      'Tono que no pertenece a la función, o imagen faltante/sobrante.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Tope diario de uso justo alcanzado (`LIMITE_DIARIO`).',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido o vencido.' })
  async ejecutar(
    @Dispositivo() actual: DispositivoAutenticado,
    @Body() dto: GenerarDto,
  ): Promise<RespuestaGeneradaDto> {
    return this.generar.ejecutar({
      deviceId: actual.deviceId,
      funcion: dto.funcion,
      tonoId: dto.tono,
      imagen: dto.imagen,
      contexto: dto.contexto,
      esRegeneracion: dto.esRegeneracion ?? false,
      mensajeAnterior: dto.mensajeAnterior,
    });
  }
}
