import { createParamDecorator, ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { PassportModule } from '@nestjs/passport';

import { DispositivoAutenticado, JwtStrategy } from './jwt.strategy';

/** Protege un endpoint: exige `Authorization: Bearer <token>`. */
export const GuardDispositivo = AuthGuard('jwt');

/**
 * Inyecta el dispositivo autenticado en el controlador:
 *
 *   generar(@Dispositivo() dispositivo: DispositivoAutenticado) { ... }
 */
export const Dispositivo = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): DispositivoAutenticado =>
    ctx.switchToHttp().getRequest().user,
);

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          // El tipo espera un literal tipo "30d"; lo que viene del .env es
          // un string cualquiera, así que la conversión es inevitable.
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '30d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
