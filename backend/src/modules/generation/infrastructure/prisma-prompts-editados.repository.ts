import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { Funcion } from '../domain/catalogo';
import {
  PromptEditado,
  PromptsEditadosRepository,
} from '../domain/prompts-editados';

/** Las ediciones de "Entrenar a la IA", en la tabla `tone_overrides`. */
@Injectable()
export class PrismaPromptsEditadosRepository
  implements PromptsEditadosRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async buscar(funcion: Funcion, tonoId: string): Promise<string | null> {
    const fila = await this.prisma.toneOverride.findUnique({
      where: { feature_tone: { feature: funcion, tone: tonoId } },
      select: { instruction: true },
    });
    return fila?.instruction ?? null;
  }

  async listar(): Promise<PromptEditado[]> {
    const filas = await this.prisma.toneOverride.findMany();
    return filas.map((fila) => ({
      funcion: fila.feature as Funcion,
      tonoId: fila.tone,
      instruccion: fila.instruction,
      actualizadoEn: fila.updatedAt,
    }));
  }

  async guardar(
    funcion: Funcion,
    tonoId: string,
    instruccion: string,
  ): Promise<void> {
    await this.prisma.toneOverride.upsert({
      where: { feature_tone: { feature: funcion, tone: tonoId } },
      create: { feature: funcion, tone: tonoId, instruction: instruccion },
      update: { instruction: instruccion },
    });
  }

  async borrar(funcion: Funcion, tonoId: string): Promise<void> {
    // deleteMany y no delete: restaurar algo que nunca se editó no es un
    // error, es no hacer nada.
    await this.prisma.toneOverride.deleteMany({
      where: { feature: funcion, tone: tonoId },
    });
  }
}
