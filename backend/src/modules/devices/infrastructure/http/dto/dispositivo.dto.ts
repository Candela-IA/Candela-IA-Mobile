import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

import { Plataforma } from '../../../domain/dispositivo.aggregate';

export class RegistrarDispositivoDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6a7b8',
    description:
      'ANDROID_ID en Android, o el UUID guardado en Keychain en iOS. Ambos ' +
      'sobreviven a desinstalar la app, que es justo lo que hace que los 5 ' +
      'intentos gratis no se reinicien.',
  })
  @IsString()
  @Length(8, 128)
  @Matches(/^[A-Za-z0-9._:-]+$/, {
    message: 'deviceKey solo admite letras, números y . _ : -',
  })
  deviceKey!: string;

  @ApiProperty({ enum: Plataforma, example: Plataforma.ANDROID })
  @IsEnum(Plataforma)
  plataforma!: Plataforma;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  appVersion?: string;
}

/** El contador de UNA función. */
export class SaldoFuncionDto {
  @ApiProperty({
    example: 'ANALIZAR_CHAT',
    description:
      'A qué función pertenece este contador. Coincide con el id que sirve ' +
      'el catálogo.',
  })
  funcion!: string;

  @ApiProperty({ example: 4, description: 'El "4" del contador 4/6.' })
  gratisUsados!: number;

  @ApiProperty({ example: 6, description: 'El "6" del contador 4/6.' })
  gratisTotales!: number;

  @ApiProperty({ example: 2 })
  gratisRestantes!: number;

  @ApiProperty({
    example: true,
    description:
      'Si es false, la app abre el paywall en vez de dejar generar EN ESTA ' +
      'función. Las demás pueden seguir teniendo intentos.',
  })
  puedeGenerar!: boolean;
}

export class SaldoDto {
  @ApiProperty({ example: false })
  esPremium!: boolean;

  @ApiProperty({
    type: [SaldoFuncionDto],
    description:
      'Un contador por función: desde el 5 de septiembre de 2026 cada una ' +
      'tiene sus propios 6 intentos gratis semanales. Es lo que debe pintar ' +
      'la app; los campos sueltos de abajo son la suma.',
  })
  // `readonly` para poder devolver el objeto del dominio tal cual, sin
  // copiarlo solo para satisfacer al tipo.
  funciones!: readonly SaldoFuncionDto[];

  @ApiProperty({
    example: 20,
    deprecated: true,
    description: 'Suma de las cuatro bolsas. Solo para el APK anterior.',
  })
  gratisUsados!: number;

  @ApiProperty({ example: 24, deprecated: true })
  gratisTotales!: number;

  @ApiProperty({ example: 4, deprecated: true })
  gratisRestantes!: number;

  @ApiProperty({ example: 4 })
  usadosHoy!: number;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Tope diario de uso justo. Solo aplica a suscriptores.',
  })
  limiteDiario!: number | null;

  @ApiProperty({
    example: true,
    deprecated: true,
    description:
      '¿Le queda algo en alguna bolsa? Para decidir si dejar generar, mira ' +
      'el `puedeGenerar` de la función correspondiente.',
  })
  puedeGenerar!: boolean;
}

export class SesionDto {
  @ApiProperty({
    description:
      'JWT del dispositivo. Guárdalo en expo-secure-store y mándalo como ' +
      'Authorization: Bearer en cada petición.',
  })
  token!: string;

  @ApiProperty({ type: SaldoDto })
  saldo!: SaldoDto;
}
