import { ApiProperty } from '@nestjs/swagger';

/**
 * Los DTO cumplen doble función: definen el contrato con la app móvil y,
 * gracias a los decoradores, generan la documentación de Swagger sola.
 * Nunca hay una doc desincronizada del código.
 */

export class TonoDto {
  @ApiProperty({ example: 'ligar', description: 'Identificador estable.' })
  id!: string;

  @ApiProperty({ example: 'Ligar' })
  etiqueta!: string;

  @ApiProperty({ example: '😘' })
  emoji!: string;

  @ApiProperty({
    example: 'Con humor y chispa',
    nullable: true,
    description: 'Subtítulo de la tarjeta. No todas las pantallas lo muestran.',
  })
  descripcion!: string | null;

  @ApiProperty({
    example: false,
    description: 'Si es true, la app pinta la corona 👑 y exige suscripción.',
  })
  esPremium!: boolean;
}

export class FuncionDto {
  @ApiProperty({
    example: 'ANALIZAR_CHAT',
    enum: ['ANALIZAR_CHAT', 'ANALIZAR_STORIES', 'ROMPEHIELOS', 'CREAR_NOTAS'],
  })
  id!: string;

  @ApiProperty({ example: 'Analizar chat' })
  etiqueta!: string;

  @ApiProperty({
    example: true,
    description:
      'Si es true, la app muestra la zona de "Agregar captura" y bloquea ' +
      'el botón hasta que haya imagen.',
  })
  requiereImagen!: boolean;

  @ApiProperty({
    example: true,
    description: 'Si acepta la nota de contexto opcional del usuario.',
  })
  aceptaContexto!: boolean;

  @ApiProperty({
    example: null,
    nullable: true,
    description:
      'Tope de caracteres de la salida. 60 en Crear notas (límite real de ' +
      'Instagram), null en el resto. La app pinta el contador con esto.',
  })
  maxCaracteres!: number | null;

  @ApiProperty({ type: [TonoDto] })
  tonos!: TonoDto[];
}
