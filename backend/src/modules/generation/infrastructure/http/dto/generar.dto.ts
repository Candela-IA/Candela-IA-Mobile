import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBase64,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { Funcion } from '../../../domain/catalogo';
import { SaldoDto } from '../../../../devices/infrastructure/http/dto/dispositivo.dto';

/** Tipos que aceptamos. La app comprime a JPEG antes de subir. */
const MIMES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * ~9 MB en base64 ≈ 6.5 MB de imagen real. Muy por encima de lo que manda
 * la app (comprime a ~200 KB), pero deja margen para capturas largas de
 * conversaciones sin abrir la puerta a subidas absurdas.
 */
const MAX_BASE64 = 9_000_000;

export class ImagenDto {
  @ApiProperty({
    description: 'Contenido en base64, SIN el prefijo "data:image/...".',
    example: '/9j/4AAQSkZJRgABAQAAAQ...',
  })
  @IsString()
  @IsBase64()
  @MaxLength(MAX_BASE64, { message: 'La imagen es demasiado grande.' })
  base64!: string;

  @ApiProperty({ enum: MIMES_PERMITIDOS, example: 'image/jpeg' })
  @IsIn(MIMES_PERMITIDOS)
  mimeType!: string;
}

export class GenerarDto {
  @ApiProperty({
    enum: Funcion,
    example: Funcion.ANALIZAR_CHAT,
    description: 'Qué función de las cuatro se está usando.',
  })
  @IsEnum(Funcion)
  funcion!: Funcion;

  @ApiProperty({
    example: 'ligar',
    description:
      'Identificador del tono. Tiene que pertenecer a esa función — el ' +
      'catálogo dice cuáles valen.',
  })
  @IsString()
  tono!: string;

  @ApiPropertyOptional({
    type: ImagenDto,
    description:
      'Obligatoria en ANALIZAR_CHAT y ANALIZAR_STORIES. Prohibida en ' +
      'ROMPEHIELOS y CREAR_NOTAS.',
  })
  @IsOptional()
  imagen?: ImagenDto;

  @ApiPropertyOptional({
    example: 'La conocí en el gym, hablamos poco pero hubo buena onda.',
    maxLength: 500,
    description: 'La nota opcional de "Dale el contexto a la IA".',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  contexto?: string;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description:
      'true cuando viene de "Generar otra respuesta". Le pide a la IA que ' +
      'cambie el ángulo, y queda anotado en las métricas. Consume un ' +
      'crédito igual que la primera.',
  })
  @IsOptional()
  @IsBoolean()
  esRegeneracion?: boolean;

  @ApiPropertyOptional({
    example: 'pregunta seria y sin miedo: ¿piña en la pizza, sí o no?',
    description:
      'El mensaje que el usuario ya tiene en pantalla. Solo sirve para no ' +
      'repetir el mismo rompehielos dos veces seguidas. No se almacena.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mensajeAnterior?: string;
}

export class RespuestaGeneradaDto {
  @ApiProperty({
    description: 'Úsalo para enviar la calificación después.',
    example: 'c1a2b3d4-...',
  })
  generacionId!: string;

  @ApiProperty({
    example:
      'Hay personas que te hacen querer apagar el teléfono y hay personas ' +
      'que te hacen querer seguir escribiendo. Tú eres de las segundas ❤️',
    description: 'Listo para copiar y enviar.',
  })
  mensaje!: string;

  @ApiProperty({ type: SaldoDto })
  saldo!: SaldoDto;
}
