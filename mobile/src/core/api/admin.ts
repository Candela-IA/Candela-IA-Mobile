import { FuncionApi } from './candela';
import { peticion } from './cliente';

/**
 * Llamadas del panel "Entrenar a la IA" (Ajustes → candado).
 *
 * Usan un token de administrador que da el backend a cambio de la
 * contraseña del panel. No sirve el token del dispositivo, y este no sirve
 * para generar.
 */

export interface TonoPanelApi {
  id: string;
  etiqueta: string;
  emoji: string;
  esPremium: boolean;
  /** La que usa la IA ahora mismo. */
  instruccion: string;
  instruccionOriginal: string;
  editado: boolean;
  actualizadoEn: string | null;
  /** Otras funciones con este mismo tono. */
  tambienEn: FuncionApi[];
}

export interface FuncionPanelApi {
  id: FuncionApi;
  etiqueta: string;
  requiereImagen: boolean;
  aceptaContexto: boolean;
  tonos: TonoPanelApi[];
}

export interface PanelApi {
  funciones: FuncionPanelApi[];
  largoMinimo: number;
  largoMaximo: number;
}

export interface PruebaApi {
  mensaje: string;
  costoUsd: number;
  latenciaMs: number;
}

export function entrarAlPanel(contrasena: string): Promise<{ token: string }> {
  return peticion<{ token: string }>('/admin/acceso', {
    metodo: 'POST',
    cuerpo: { contrasena },
  });
}

export function obtenerPanel(token: string): Promise<PanelApi> {
  return peticion<PanelApi>('/admin/prompts', { token });
}

export function guardarPrompt(
  token: string,
  funcion: FuncionApi,
  tono: string,
  datos: { instruccion: string; aplicarTambienA?: FuncionApi[] },
): Promise<PanelApi> {
  return peticion<PanelApi>(`/admin/prompts/${funcion}/${encodeURIComponent(tono)}`, {
    metodo: 'PUT',
    cuerpo: datos,
    token,
  });
}

export function restaurarPrompt(
  token: string,
  funcion: FuncionApi,
  tono: string,
): Promise<PanelApi> {
  return peticion<PanelApi>(`/admin/prompts/${funcion}/${encodeURIComponent(tono)}`, {
    metodo: 'DELETE',
    token,
  });
}

export function probarPrompt(
  token: string,
  funcion: FuncionApi,
  tono: string,
  datos: {
    instruccion: string;
    imagen?: { base64: string; mimeType: string };
    contexto?: string;
  },
): Promise<PruebaApi> {
  return peticion<PruebaApi>(
    `/admin/prompts/${funcion}/${encodeURIComponent(tono)}/probar`,
    { metodo: 'POST', cuerpo: datos, token },
  );
}
