/**
 * El panel "Entrenar a la IA", sin base de datos ni OpenAI: el repositorio
 * y la IA son dobles en memoria.
 */

import {
  ImagenRequeridaError,
  PromptInvalidoError,
  TonoInvalidoError,
  TonoNoEditableError,
} from '../../../shared/domain/domain-error';
import {
  AiProvider,
  PeticionGeneracion,
} from '../../generation/domain/ai-provider.port';
import { Funcion, obtenerTono } from '../../generation/domain/catalogo';
import {
  conInstruccion,
  PromptEditado,
  PromptsEditadosRepository,
  validarInstruccion,
} from '../../generation/domain/prompts-editados';
import {
  contrasenaCorrecta,
  huellaContrasena,
  panelHabilitado,
} from '../domain/acceso-admin';
import { PanelPromptsService } from './panel-prompts.service';

const NUEVA =
  'QUÉ BUSCAS: que se ría. CÓMO SUENA: corto. NUNCA: chistes de manual.';

class RepoEnMemoria implements PromptsEditadosRepository {
  readonly filas = new Map<string, PromptEditado>();

  async buscar(funcion: Funcion, tonoId: string) {
    return this.filas.get(`${funcion}/${tonoId}`)?.instruccion ?? null;
  }
  async listar() {
    return [...this.filas.values()];
  }
  async guardar(funcion: Funcion, tonoId: string, instruccion: string) {
    this.filas.set(`${funcion}/${tonoId}`, {
      funcion,
      tonoId,
      instruccion,
      actualizadoEn: new Date('2026-11-23T12:00:00Z'),
    });
  }
  async borrar(funcion: Funcion, tonoId: string) {
    this.filas.delete(`${funcion}/${tonoId}`);
  }
}

class IaQueRecuerda implements AiProvider {
  ultima?: PeticionGeneracion;

  async generar(peticion: PeticionGeneracion) {
    this.ultima = peticion;
    return {
      mensaje: 'jajaja buenísimo',
      lectura: '',
      uso: { entrada: 1, entradaCacheada: 0, salida: 1 },
      costoUsd: 0.001,
      latenciaMs: 10,
    };
  }
}

function montar() {
  const repo = new RepoEnMemoria();
  const ia = new IaQueRecuerda();
  return { repo, ia, panel: new PanelPromptsService(repo, ia) };
}

const IMAGEN = { base64: 'aGVsbG8=', mimeType: 'image/jpeg' };

describe('validarInstruccion', () => {
  it('quita espacios de los extremos', () => {
    expect(validarInstruccion(`  ${NUEVA}  `)).toBe(NUEVA);
  });

  it('rechaza una instrucción vacía o muy corta', () => {
    expect(() => validarInstruccion('')).toThrow(PromptInvalidoError);
    expect(() => validarInstruccion('sé gracioso')).toThrow(PromptInvalidoError);
  });

  it('rechaza una instrucción demasiado larga', () => {
    expect(() => validarInstruccion('a'.repeat(3_001))).toThrow(
      PromptInvalidoError,
    );
  });
});

describe('conInstruccion', () => {
  const tono = obtenerTono(Funcion.ANALIZAR_CHAT, 'divertida');

  it('sin edición devuelve el tono tal cual', () => {
    expect(conInstruccion(tono, null)).toBe(tono);
  });

  it('con edición cambia solo la instrucción', () => {
    const editado = conInstruccion(tono, NUEVA);
    expect(editado.instruccion).toBe(NUEVA);
    expect(editado.nivel).toBe(tono.nivel);
    expect(editado.etiqueta).toBe(tono.etiqueta);
  });
});

describe('acceso al panel', () => {
  it('sin contraseña configurada, o muy corta, el panel está cerrado', () => {
    expect(panelHabilitado(undefined)).toBe(false);
    expect(panelHabilitado('')).toBe(false);
    expect(panelHabilitado('corta')).toBe(false);
    expect(panelHabilitado('una-contraseña-larga')).toBe(true);
  });

  it('compara la contraseña exacta', () => {
    expect(contrasenaCorrecta('una-contraseña-larga', 'una-contraseña-larga')).toBe(true);
    expect(contrasenaCorrecta('una-contraseña-largA', 'una-contraseña-larga')).toBe(false);
    expect(contrasenaCorrecta('', 'una-contraseña-larga')).toBe(false);
  });

  it('cambiar la contraseña cambia la huella de los tokens', () => {
    expect(huellaContrasena('primera-contraseña')).not.toBe(
      huellaContrasena('segunda-contraseña'),
    );
    expect(huellaContrasena('primera-contraseña')).toBe(
      huellaContrasena('primera-contraseña'),
    );
  });
});

describe('PanelPromptsService', () => {
  it('lista las cuatro funciones con la instrucción original', async () => {
    const { panel } = montar();
    const resultado = await panel.listar();

    expect(resultado.funciones.map((f) => f.id)).toEqual(
      Object.values(Funcion),
    );
    const divertida = resultado.funciones[0].tonos.find(
      (t) => t.id === 'divertida',
    )!;
    expect(divertida.editado).toBe(false);
    expect(divertida.instruccion).toBe(divertida.instruccionOriginal);
  });

  it('no ofrece el Básico de Rompehielos: no usa la IA', async () => {
    const { panel } = montar();
    const rompehielos = (await panel.listar()).funciones.find(
      (f) => f.id === Funcion.ROMPEHIELOS,
    )!;

    expect(rompehielos.tonos.map((t) => t.id)).not.toContain('basico');
    await expect(
      panel.guardar(Funcion.ROMPEHIELOS, 'basico', NUEVA),
    ).rejects.toThrow(TonoNoEditableError);
  });

  it('guarda una edición y la lista como editada', async () => {
    const { panel } = montar();
    const resultado = await panel.guardar(
      Funcion.ANALIZAR_CHAT,
      'seguro',
      NUEVA,
    );

    const seguro = resultado.funciones
      .find((f) => f.id === Funcion.ANALIZAR_CHAT)!
      .tonos.find((t) => t.id === 'seguro')!;
    expect(seguro.editado).toBe(true);
    expect(seguro.instruccion).toBe(NUEVA);
    expect(seguro.instruccionOriginal).not.toBe(NUEVA);
  });

  it('una edición en Chat no toca el mismo tono en Stories', async () => {
    const { panel, repo } = montar();
    await panel.guardar(Funcion.ANALIZAR_CHAT, 'seguro', NUEVA);

    expect(await repo.buscar(Funcion.ANALIZAR_STORIES, 'seguro')).toBeNull();
  });

  it('"Aplicar también a" guarda en las otras funciones pedidas', async () => {
    const { panel, repo } = montar();
    await panel.guardar(Funcion.ANALIZAR_CHAT, 'seguro', NUEVA, [
      Funcion.ANALIZAR_STORIES,
    ]);

    expect(await repo.buscar(Funcion.ANALIZAR_STORIES, 'seguro')).toBe(NUEVA);
  });

  it('si un destino no tiene ese tono, no guarda en ninguno', async () => {
    const { panel, repo } = montar();

    await expect(
      panel.guardar(Funcion.ANALIZAR_CHAT, 'seguro', NUEVA, [
        Funcion.CREAR_NOTAS,
      ]),
    ).rejects.toThrow(TonoInvalidoError);
    expect(repo.filas.size).toBe(0);
  });

  it('dice en qué otras funciones existe el mismo tono', async () => {
    const { panel } = montar();
    const chat = (await panel.listar()).funciones.find(
      (f) => f.id === Funcion.ANALIZAR_CHAT,
    )!;

    expect(chat.tonos.find((t) => t.id === 'seguro')!.tambienEn).toEqual([
      Funcion.ANALIZAR_STORIES,
    ]);
    expect(chat.tonos.find((t) => t.id === 'ligar')!.tambienEn).toEqual([]);
  });

  it('restaurar vuelve a la original', async () => {
    const { panel, repo } = montar();
    await panel.guardar(Funcion.CREAR_NOTAS, 'divertidas', NUEVA);
    await panel.restaurar(Funcion.CREAR_NOTAS, 'divertidas');

    expect(await repo.buscar(Funcion.CREAR_NOTAS, 'divertidas')).toBeNull();
  });

  it('probar genera con la instrucción nueva sin guardarla', async () => {
    const { panel, repo, ia } = montar();
    const prueba = await panel.probar({
      funcion: Funcion.CREAR_NOTAS,
      tonoId: 'divertidas',
      instruccion: NUEVA,
    });

    expect(ia.ultima!.tono.instruccion).toBe(NUEVA);
    expect(repo.filas.size).toBe(0);
    // El mismo guardia de ortografía que la generación real.
    expect(prueba.mensaje).toBe('Jajaja buenísimo');
  });

  it('probar exige captura donde la generación la exige', async () => {
    const { panel } = montar();

    await expect(
      panel.probar({
        funcion: Funcion.ANALIZAR_CHAT,
        tonoId: 'divertida',
        instruccion: NUEVA,
      }),
    ).rejects.toThrow(ImagenRequeridaError);

    await expect(
      panel.probar({
        funcion: Funcion.ANALIZAR_CHAT,
        tonoId: 'divertida',
        instruccion: NUEVA,
        imagen: IMAGEN,
      }),
    ).resolves.toBeDefined();
  });
});
