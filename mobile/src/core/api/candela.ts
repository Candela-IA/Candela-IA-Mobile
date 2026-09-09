import { TonoAcento } from '../theme';
import { peticion } from './cliente';

/**
 * Tipos y llamadas del backend de Candela.
 *
 * Los tipos replican los DTO de NestJS. Como ambos lados son TypeScript,
 * cuando el backend cambie un campo aquí saltará el error de compilación en
 * vez de fallar en el celular.
 */

// ── Catálogo ──────────────────────────────────────────────────────────────

export type FuncionApi =
  | 'ANALIZAR_CHAT'
  | 'ANALIZAR_STORIES'
  | 'ROMPEHIELOS'
  | 'CREAR_NOTAS';

export interface TonoApi {
  id: string;
  etiqueta: string;
  emoji: string;
  descripcion: string | null;
  esPremium: boolean;
  /** Acento de la marca con el que se pinta. Lo decide el catálogo. */
  color: TonoAcento;
}

export interface DefinicionFuncionApi {
  id: FuncionApi;
  etiqueta: string;
  requiereImagen: boolean;
  aceptaContexto: boolean;
  maxCaracteres: number | null;
  tonos: TonoApi[];
}

export function obtenerCatalogo(): Promise<DefinicionFuncionApi[]> {
  return peticion<DefinicionFuncionApi[]>('/catalogo');
}

// ── Dispositivo ───────────────────────────────────────────────────────────

/** El contador de UNA función: cada pantalla pinta el suyo. */
export interface SaldoFuncionApi {
  funcion: FuncionApi;
  gratisUsados: number;
  gratisTotales: number;
  gratisRestantes: number;
  puedeGenerar: boolean;
}

export interface SaldoApi {
  esPremium: boolean;
  /** Acento de la marca con el que se pinta. Lo decide el catálogo. */
  color: TonoAcento;
  /**
   * Un contador por función. Desde el 5 de septiembre de 2026 los intentos
   * gratis no son una bolsa compartida: cada función tiene los suyos.
   *
   * Opcional porque un backend anterior al cambio no lo manda, y la app tiene
   * que seguir arrancando contra él en vez de romperse.
   */
  funciones?: SaldoFuncionApi[];
  usadosHoy: number;
  limiteDiario: number | null;

  /** @deprecated Suma de las cuatro bolsas. Usa `funciones`. */
  gratisUsados: number;
  /** @deprecated */
  gratisTotales: number;
  /** @deprecated */
  gratisRestantes: number;
  /** @deprecated Mira el `puedeGenerar` de la función que toca. */
  puedeGenerar: boolean;
}

export interface SesionApi {
  token: string;
  saldo: SaldoApi;
}

export function registrarDispositivo(datos: {
  deviceKey: string;
  plataforma: 'ANDROID' | 'IOS';
  appVersion?: string;
}): Promise<SesionApi> {
  return peticion<SesionApi>('/dispositivos/registrar', {
    metodo: 'POST',
    cuerpo: datos,
  });
}

export function consultarSaldo(token: string): Promise<SaldoApi> {
  return peticion<SaldoApi>('/dispositivos/saldo', { token });
}

// ── Generación ────────────────────────────────────────────────────────────

export interface RespuestaGeneradaApi {
  generacionId: string;
  mensaje: string;
  saldo: SaldoApi;
}

export function generar(
  token: string,
  datos: {
    funcion: FuncionApi;
    tono: string;
    imagen?: { base64: string; mimeType: string };
    contexto?: string;
    esRegeneracion?: boolean;
    /** Para no repetir el mismo rompehielos al pedir otro. */
    mensajeAnterior?: string;
  },
): Promise<RespuestaGeneradaApi> {
  return peticion<RespuestaGeneradaApi>('/generar', {
    metodo: 'POST',
    cuerpo: datos,
    token,
    // Generar tarda 3-6s con IA real; el timeout general es de 60s y aquí
    // conviene dejarlo así en vez de acortarlo.
  });
}
