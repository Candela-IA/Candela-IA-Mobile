import { AppConfig } from '../../config/app_config';

/**
 * Cliente HTTP del backend.
 *
 * Deliberadamente pequeño: `fetch` con timeout, el token del dispositivo y
 * traducción de errores. No hace falta axios para esto.
 */

/** Códigos estables que devuelve el backend. La app decide según estos. */
export type CodigoError =
  | 'SIN_CREDITOS'
  | 'TONO_PREMIUM'
  | 'LIMITE_DIARIO'
  | 'TONO_INVALIDO'
  | 'IMAGEN_REQUERIDA'
  | 'IMAGEN_NO_ESPERADA'
  | 'DISPOSITIVO_NO_ENCONTRADO'
  | 'GENERACION_RECHAZADA'
  | 'GENERACION_FALLIDA'
  | 'SIN_CONEXION'
  | 'DESCONOCIDO';

export class ErrorApi extends Error {
  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
    readonly estado?: number,
    readonly reintentable = false,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }

  /** Los dos casos en que la app debe abrir el paywall. */
  get requierePaywall(): boolean {
    return this.codigo === 'SIN_CREDITOS' || this.codigo === 'TONO_PREMIUM';
  }
}

type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface Opciones {
  metodo?: Metodo;
  cuerpo?: unknown;
  token?: string | null;
  /** Sobrescribe el timeout por defecto (generar tarda más que consultar). */
  timeoutMs?: number;
}

/**
 * REINTENTOS
 *
 * Desplegar el backend lo deja unos segundos sin responder, y a quien pulsara
 * "Generar" justo entonces le salía un "Algo salió mal" que no era culpa
 * suya ni de su conexión. Reintentando solo, ese hueco pasa desapercibido.
 */
const REINTENTOS = 2;
const ESPERA_BASE_MS = 600;

/**
 * Por debajo de este tiempo, el servidor NO llegó a procesar la petición.
 *
 * Es la salvaguarda que hace seguro reintentar un `POST /generar`, que cobra
 * un crédito: generar tarda entre 3 y 8 segundos, así que un fallo en menos
 * de dos segundos y medio significa que la petición ni siquiera se ejecutó.
 * Si fallara más tarde podría haberse cobrado ya, y reintentar cobraría dos
 * veces por un solo mensaje.
 */
const UMBRAL_NO_PROCESADO_MS = 2_500;

export async function peticion<T>(
  ruta: string,
  opciones: Opciones = {},
): Promise<T> {
  let ultimoError: ErrorApi | undefined;

  for (let intento = 0; intento <= REINTENTOS; intento++) {
    const inicio = Date.now();

    try {
      return await peticionUnica<T>(ruta, opciones);
    } catch (e) {
      if (!(e instanceof ErrorApi)) throw e;
      ultimoError = e;

      const ultimo = intento === REINTENTOS;
      const duracion = Date.now() - inicio;

      if (ultimo || !sePuedeReintentar(e, opciones.metodo, duracion)) throw e;

      // Espera creciente: si el backend está arrancando, el segundo intento
      // le da más margen que el primero.
      await dormir(ESPERA_BASE_MS * (intento + 1));
    }
  }

  throw ultimoError;
}

/**
 * ¿Es seguro repetir esta petición?
 *
 * Un GET se puede repetir siempre, porque no cambia nada. Un POST solo
 * cuando consta que el servidor no llegó a procesarlo.
 */
export function sePuedeReintentar(
  error: ErrorApi,
  metodo: Metodo = 'GET',
  duracionMs: number,
): boolean {
  if (!error.reintentable) return false;
  if (metodo === 'GET') return true;

  return duracionMs < UMBRAL_NO_PROCESADO_MS;
}

function dormir(ms: number): Promise<void> {
  return new Promise((listo) => setTimeout(listo, ms));
}

async function peticionUnica<T>(
  ruta: string,
  { metodo = 'GET', cuerpo, token, timeoutMs = AppConfig.timeoutMs }: Opciones = {},
): Promise<T> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  try {
    const respuesta = await fetch(`${AppConfig.baseUrl}${ruta}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: controlador.signal,
    });

    if (!respuesta.ok) throw await traducirRespuesta(respuesta);

    // 204 y similares no traen cuerpo.
    if (respuesta.status === 204) return undefined as T;

    return (await respuesta.json()) as T;
  } catch (e) {
    if (e instanceof ErrorApi) throw e;

    // `fetch` lanza TypeError cuando no hay red, y AbortError al vencer el
    // timeout. Los dos son "no llegamos al servidor" desde el punto de
    // vista del usuario.
    throw new ErrorApi(
      'SIN_CONEXION',
      'No pudimos conectarnos. Revisa tu conexión a internet.',
      undefined,
      true,
    );
  } finally {
    clearTimeout(temporizador);
  }
}

async function traducirRespuesta(respuesta: Response): Promise<ErrorApi> {
  let codigo: CodigoError = 'DESCONOCIDO';
  let mensaje = 'Algo salió mal. Intenta de nuevo.';
  let reintentable = respuesta.status >= 500;

  try {
    const cuerpo = await respuesta.json();
    if (typeof cuerpo?.codigo === 'string') codigo = cuerpo.codigo;
    if (typeof cuerpo?.mensaje === 'string') mensaje = cuerpo.mensaje;
    if (typeof cuerpo?.reintentable === 'boolean') reintentable = cuerpo.reintentable;
  } catch {
    // Respuesta sin JSON válido: nos quedamos con los valores por defecto.
  }

  return new ErrorApi(codigo, mensaje, respuesta.status, reintentable);
}
