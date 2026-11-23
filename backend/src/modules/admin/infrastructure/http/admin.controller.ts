import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseEnumPipe,
  Post,
  Put,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

import { Funcion } from '../../../generation/domain/catalogo';
import {
  Panel,
  PanelPromptsService,
  Prueba,
} from '../../application/panel-prompts.service';
import {
  contrasenaCorrecta,
  DURACION_SESION_ADMIN,
  huellaContrasena,
  panelHabilitado,
  ROL_ADMIN,
} from '../../domain/acceso-admin';
import { AdminGuard } from '../admin.guard';
import {
  AccesoAdminDto,
  GuardarPromptDto,
  ProbarPromptDto,
  SesionAdminDto,
} from './dto/admin.dto';

const FUNCION = new ParseEnumPipe(Funcion);

/**
 * El panel "Entrenar a la IA" que se abre desde Ajustes con el candado.
 *
 * Todo menos `acceso` exige el token de administrador (`AdminGuard`). Un
 * usuario normal de la app no puede leer ni tocar nada de esto aunque
 * conozca las rutas, que están publicadas en Swagger.
 */
@ApiTags('Panel de administración')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly panel: PanelPromptsService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Post('acceso')
  @HttpCode(HttpStatus.OK)
  // Lo que frena la fuerza bruta: cinco intentos por minuto y diez cada
  // cuarto de hora desde la misma IP. A quien se equivoca escribiendo le
  // sobra; a un script que prueba contraseñas le quita las ganas.
  @Throttle({
    corto: { ttl: 60_000, limit: 5 },
    largo: { ttl: 15 * 60_000, limit: 10 },
  })
  @ApiOperation({ summary: 'Entrar al panel con la contraseña' })
  @ApiUnauthorizedResponse({ description: 'Contraseña incorrecta.' })
  @ApiTooManyRequestsResponse({ description: 'Demasiados intentos.' })
  acceso(@Body() dto: AccesoAdminDto, @Req() peticion: Request): SesionAdminDto {
    const contrasena = this.config.get<string>('ADMIN_PASSWORD');

    if (!panelHabilitado(contrasena)) {
      throw new ServiceUnavailableException(
        'El panel no está activado en el servidor.',
      );
    }

    if (!contrasenaCorrecta(dto.contrasena, contrasena!)) {
      this.logger.warn(
        `Contraseña del panel incorrecta desde ${peticion.ip ?? 'origen desconocido'}.`,
      );
      throw new UnauthorizedException('Contraseña incorrecta.');
    }

    this.logger.log('Sesión abierta en el panel de prompts.');

    const token = this.jwt.sign(
      { sub: ROL_ADMIN, rol: ROL_ADMIN, huella: huellaContrasena(contrasena!) },
      { expiresIn: DURACION_SESION_ADMIN },
    );
    return { token };
  }

  @Get('prompts')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({
    summary: 'Todas las funciones y tonos, con su instrucción actual',
  })
  listar(): Promise<Panel> {
    return this.panel.listar();
  }

  @Put('prompts/:funcion/:tono')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({ summary: 'Guardar la instrucción de un tono' })
  guardar(
    @Param('funcion', FUNCION) funcion: Funcion,
    @Param('tono') tono: string,
    @Body() dto: GuardarPromptDto,
  ): Promise<Panel> {
    return this.panel.guardar(
      funcion,
      tono,
      dto.instruccion,
      dto.aplicarTambienA ?? [],
    );
  }

  @Delete('prompts/:funcion/:tono')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('admin')
  @ApiOperation({ summary: 'Volver a la instrucción original del tono' })
  restaurar(
    @Param('funcion', FUNCION) funcion: Funcion,
    @Param('tono') tono: string,
  ): Promise<Panel> {
    return this.panel.restaurar(funcion, tono);
  }

  @Post('prompts/:funcion/:tono/probar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @ApiBearerAuth('admin')
  // Cada prueba cuesta lo mismo que una generación real.
  @Throttle({ corto: { ttl: 10_000, limit: 3 } })
  @ApiOperation({
    summary: 'Generar con una instrucción sin guardarla',
    description:
      'No gasta intentos ni queda registrado, pero sí cuesta en OpenAI ' +
      'como una generación normal.',
  })
  probar(
    @Param('funcion', FUNCION) funcion: Funcion,
    @Param('tono') tono: string,
    @Body() dto: ProbarPromptDto,
  ): Promise<Prueba> {
    return this.panel.probar({
      funcion,
      tonoId: tono,
      instruccion: dto.instruccion,
      imagen: dto.imagen,
      contexto: dto.contexto,
    });
  }
}
