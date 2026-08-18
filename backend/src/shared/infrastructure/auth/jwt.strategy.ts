import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Autenticación sin login.
 *
 * La app no pide correo ni contraseña: se identifica con el ID del
 * dispositivo (ANDROID_ID en Android, UUID de Keychain en iOS) y a cambio
 * recibe este JWT. Cero fricción para el usuario, y a la vez el backend
 * sabe a quién cobrarle los créditos.
 */

export interface PayloadJwt {
  /** ID interno del dispositivo (UUID de la tabla `devices`). */
  sub: string;
}

/** Lo que queda disponible en `request.user`. */
export interface DispositivoAutenticado {
  readonly deviceId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');

    if (!secret || secret.startsWith('cambia_esto')) {
      throw new Error(
        'JWT_SECRET no está configurado en el .env. Genera uno con:\n' +
          '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: PayloadJwt): DispositivoAutenticado {
    if (!payload?.sub) {
      throw new UnauthorizedException('Token sin dispositivo.');
    }
    return { deviceId: payload.sub };
  }
}
