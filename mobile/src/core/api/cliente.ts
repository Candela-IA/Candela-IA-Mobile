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

export async function peticion<T>(
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
