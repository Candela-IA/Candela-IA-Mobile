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

export class SaldoDto {
  @ApiProperty({ example: false })
  esPremium!: boolean;

  @ApiProperty({ example: 4, description: 'El "4" del contador 4/5.' })
  gratisUsados!: number;

  @ApiProperty({ example: 5, description: 'El "5" del contador 4/5.' })
  gratisTotales!: number;

  @ApiProperty({ example: 1 })
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
    description:
      'Si es false, la app debe abrir el paywall en vez de dejar generar.',
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
