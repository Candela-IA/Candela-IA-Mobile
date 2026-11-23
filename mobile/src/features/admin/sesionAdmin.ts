import { create } from 'zustand';

/**
 * La sesión del panel "Entrenar a la IA".
 *
 * Solo en memoria, a propósito: al cerrar la app hay que volver a escribir
 * la contraseña. Guardar el token en el teléfono ahorraría eso, pero dejaría
 * el panel abierto para cualquiera que agarre el celular del cliente durante
 * doce horas.
 */
interface EstadoSesionAdmin {
  token: string | null;
  abrir: (token: string) => void;
  cerrar: () => void;
}

export const usarSesionAdmin = create<EstadoSesionAdmin>((set) => ({
  token: null,
  abrir: (token) => set({ token }),
  cerrar: () => set({ token: null }),
}));
