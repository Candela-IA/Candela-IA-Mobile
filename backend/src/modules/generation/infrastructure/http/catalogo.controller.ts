import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CATALOGO, Funcion, Nivel } from '../../domain/catalogo';
import { FuncionDto, TonoDto } from './dto/catalogo.dto';

/**
 * El catálogo se sirve por API en vez de ir quemado en la app.
 *
 * Así puedes agregar un tono, cambiar un texto o mover algo a premium con un
 * deploy del backend — sin publicar versión nueva en las tiendas. Con reviews
 * de 1 a 3 días en Apple, eso vale mucho.
 */
@ApiTags('Catálogo')
@Controller({ path: 'catalogo', version: '1' })
export class CatalogoController {
  @Get()
  @ApiOperation({
    summary: 'Funciones y tonos disponibles',
    description:
      'Lo consume la app al arrancar para pintar el home y los selectores ' +
      'de tono. Incluye qué tonos llevan corona (premium) y si cada función ' +
      'necesita captura.',
  })
  @ApiOkResponse({ type: [FuncionDto] })
  obtener(): FuncionDto[] {
    return Object.values(Funcion).map((id) => {
      const definicion = CATALOGO[id];

      return {
        id: definicion.id,
        etiqueta: definicion.etiqueta,
        requiereImagen: definicion.requiereImagen,
        aceptaContexto: definicion.aceptaContexto,
        maxCaracteres: definicion.maxCaracteres,
        tonos: definicion.tonos.map(
          (t): TonoDto => ({
            id: t.id,
            etiqueta: t.etiqueta,
            emoji: t.emoji,
            descripcion: t.descripcion ?? null,
            esPremium: t.nivel === Nivel.PREMIUM,
            color: t.color,
          }),
        ),
      };
    });
  }
}
