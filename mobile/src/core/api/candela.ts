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

export interface SaldoApi {
  esPremium: boolean;
  /** Acento de la marca con el que se pinta. Lo decide el catálogo. */
  color: TonoAcento;
  gratisUsados: number;
  gratisTotales: number;
  gratisRestantes: number;
  usadosHoy: number;
  limiteDiario: number | null;
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
