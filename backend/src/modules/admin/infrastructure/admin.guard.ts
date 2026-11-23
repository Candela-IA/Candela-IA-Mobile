import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import {
  huellaContrasena,
  panelHabilitado,
  ROL_ADMIN,
} from '../domain/acceso-admin';

interface PayloadAdmin {
  rol?: string;
  huella?: string;
}

/**
 * Deja pasar solo a quien entró con la contraseña del panel.
 *
 * Un token de dispositivo —el que tiene cualquier usuario de la app— no
 * sirve aquí: tiene que llevar `rol: admin` y la huella de la contraseña
 * ACTUAL. Si el cliente la cambia en Railway, todas las sesiones abiertas
 * caen en la siguiente petición.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(contexto: ExecutionContext): boolean {
    const contrasena = this.config.get<string>('ADMIN_PASSWORD');
    if (!panelHabilitado(contrasena)) throw new UnauthorizedException();

    const peticion = contexto.switchToHttp().getRequest<Request>();
    const cabecera = peticion.header('authorization') ?? '';
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
    if (!token) throw new UnauthorizedException();

    let payload: PayloadAdmin;
    try {
      payload = this.jwt.verify<PayloadAdmin>(token);
    } catch {
      throw new UnauthorizedException('La sesión del panel venció.');
    }

    if (
      payload.rol !== ROL_ADMIN ||
      payload.huella !== huellaContrasena(contrasena!)
    ) {
      throw new UnauthorizedException('La sesión del panel venció.');
    }

    return true;
  }
}
