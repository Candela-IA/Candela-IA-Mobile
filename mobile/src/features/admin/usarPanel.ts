import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { obtenerPanel, PanelApi } from '../../core/api/admin';
import { ErrorApi } from '../../core/api/cliente';
import { usarSesionAdmin } from './sesionAdmin';

export const CLAVE_PANEL = ['panel-admin'] as const;

/**
 * El panel entero —funciones, tonos e instrucciones— en una sola consulta.
 *
 * Son 25 tonos de texto: pedirlo todo de una vez es más simple que paginar,
 * y así las tres pantallas leen la misma copia y lo que se guarda en una se
 * ve al instante en las otras.
 *
 * Si el servidor dice que la sesión ya no vale (venció a las 12 horas, o el
 * cliente cambió la contraseña), se cierra aquí y la pantalla vuelve a
 * pedir la contraseña.
 */
export function usarPanel() {
  const token = usarSesionAdmin((estado) => estado.token);
  const cerrar = usarSesionAdmin((estado) => estado.cerrar);

  const consulta = useQuery({
    queryKey: CLAVE_PANEL,
    queryFn: () => obtenerPanel(token!),
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: (intentos, error) =>
      !(error instanceof ErrorApi && error.codigo === 'NO_AUTORIZADO') &&
      intentos < 2,
  });

  useEffect(() => {
    if (
      consulta.error instanceof ErrorApi &&
      consulta.error.codigo === 'NO_AUTORIZADO'
    ) {
      cerrar();
    }
  }, [consulta.error, cerrar]);

  return { token, ...consulta };
}

/** Para que guardar y restaurar dejen el panel al día sin otra petición. */
export function usarActualizarPanel() {
  const cliente = useQueryClient();
  return (panel: PanelApi) => cliente.setQueryData(CLAVE_PANEL, panel);
}

/** Si un error es de sesión vencida, la cierra y devuelve true. */
export function cerrarSiVencio(error: unknown): boolean {
  if (error instanceof ErrorApi && error.codigo === 'NO_AUTORIZADO') {
    usarSesionAdmin.getState().cerrar();
    return true;
  }
  return false;
}
