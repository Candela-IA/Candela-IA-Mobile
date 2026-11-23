import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Funcion } from '../../../../generation/domain/catalogo';
import { ImagenDto } from '../../../../generation/infrastructure/http/dto/generar.dto';

export class AccesoAdminDto {
  @ApiProperty({ description: 'La contraseña del panel (ADMIN_PASSWORD).' })
  @IsString()
  @MaxLength(200)
  contrasena!: string;
}

export class SesionAdminDto {
  @ApiProperty({ description: 'Token de administrador. Dura 12 horas.' })
  token!: string;
}

export class GuardarPromptDto {
  @ApiProperty({
    description:
      'La nueva instrucción del tono. Reemplaza solo el bloque del tono; ' +
      'las reglas de fondo no cambian.',
  })
  @IsString()
  // El límite de verdad lo pone el dominio con un mensaje claro; este es
  // solo un tope para no aceptar cuerpos absurdos.
  @MaxLength(10_000)
  instruccion!: string;

  @ApiPropertyOptional({
    enum: Funcion,
    isArray: true,
    description:
      'Otras funciones con un tono del mismo id en las que guardar la misma ' +
      'instrucción.',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Funcion, { each: true })
  aplicarTambienA?: Funcion[];
}

export class ProbarPromptDto {
  @ApiProperty({ description: 'La instrucción a probar. No se guarda.' })
  @IsString()
  @MaxLength(10_000)
  instruccion!: string;

  @ApiPropertyOptional({
    type: ImagenDto,
    description: 'Obligatoria en ANALIZAR_CHAT y ANALIZAR_STORIES.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImagenDto)
  imagen?: ImagenDto;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  contexto?: string;
}
