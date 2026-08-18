import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  Dispositivo as DispositivoActual,
  GuardDispositivo,
} from '../../../../shared/infrastructure/auth/auth.module';
import { DispositivoAutenticado } from '../../../../shared/infrastructure/auth/jwt.strategy';
import { DispositivoNoEncontradoError } from '../../../../shared/domain/domain-error';
import {
  DISPOSITIVO_REPO,
  DispositivoRepository,
} from '../../domain/dispositivo.repository';
import { RegistrarDispositivoDto, SaldoDto, SesionDto } from './dto/dispositivo.dto';

@ApiTags('Dispositivos')
@Controller({ path: 'dispositivos', version: '1' })
export class DispositivosController {
  constructor(
    @Inject(DISPOSITIVO_REPO)
    private readonly dispositivos: DispositivoRepository,
    private readonly jwt: JwtService,
  ) {}

  @Post('registrar')
  @ApiOperation({
    summary: 'Registrar dispositivo y obtener token',
    description:
      'La app llama a esto en cada arranque. Es idempotente: si el ' +
      'dispositivo ya existía (por ejemplo reinstaló la app), devuelve su ' +
      'saldo tal cual estaba en vez de regalarle 5 intentos nuevos.\n\n' +
      'No hay registro con correo ni contraseña — la identidad es el ' +
      'dispositivo.',
  })
  @ApiCreatedResponse({ type: SesionDto })
  async registrar(@Body() dto: RegistrarDispositivoDto): Promise<SesionDto> {
    const dispositivo = await this.dispositivos.registrarORecuperar({
      deviceKey: dto.deviceKey,
      plataforma: dto.plataforma,
      appVersion: dto.appVersion,
    });

    return {
      token: this.jwt.sign({ sub: dispositivo.id }),
      saldo: dispositivo.saldoVisible(new Date()),
    };
  }

  @Get('saldo')
  @UseGuards(GuardDispositivo)
  @ApiBearerAuth('dispositivo')
  @ApiOperation({
    summary: 'Consultar créditos',
    description:
      'Para refrescar el contador al volver a la app o después de comprar ' +
      'una suscripción.',
  })
  @ApiOkResponse({ type: SaldoDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido o vencido.' })
  async saldo(
    @DispositivoActual() actual: DispositivoAutenticado,
  ): Promise<SaldoDto> {
    const dispositivo = await this.dispositivos.buscarPorId(actual.deviceId);
    if (!dispositivo) throw new DispositivoNoEncontradoError();

    return dispositivo.saldoVisible(new Date());
  }
}
