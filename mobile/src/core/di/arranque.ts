import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

/**
 * PRIMER ARRANQUE
 *
 * Recuerda si el usuario ya vio el onboarding.
 *
 * Va aparte de `preferencias` a propósito: aquello son ajustes que el
 * usuario elige, y esto es un hecho que la app registra. Mezclarlos haría
 * que "restablecer preferencias" —si algún día existe— borrara también esto
 * y le repitiera el tutorial a alguien que lleva meses usando la app.
 *
 * Se guarda en `expo-secure-store` como el resto: sobrevive a cerrar la app,
 * pero NO a desinstalarla. Eso es correcto aquí — quien reinstala vuelve a
 * ver la bienvenida. Los créditos gratis, que sí deben sobrevivir a la
 * reinstalación, se controlan en el servidor por `deviceKey`.
 */

const CLAVE = 'candela.onboardingVisto';

interface EstadoArranque {
  onboardingVisto: boolean;
  /** `false` hasta leer el disco: sin esto se vería un parpadeo del Home. */
  cargado: boolean;

  cargar: () => Promise<void>;
  marcarOnboardingVisto: () => void;
  /**
   * SOLO DESARROLLO. Olvida que ya se vio la bienvenida, para poder probar
   * el flujo de usuario nuevo sin borrar los datos de Expo Go.
   */
  olvidarOnboarding: () => void;
}

export const usarArranque = create<EstadoArranque>((set, get) => ({
  onboardingVisto: false,
  cargado: false,

  cargar: async () => {
    if (get().cargado) return;

    try {
      const guardado = await SecureStore.getItemAsync(CLAVE);
      set({ onboardingVisto: guardado === 'si', cargado: true });
    } catch {
      // Si no se puede leer, se asume que no lo vio. Repetir la bienvenida
      // molesta; saltársela a alguien nuevo le esconde el producto.
      set({ cargado: true });
    }
  },

  marcarOnboardingVisto: () => {
    if (get().onboardingVisto) return;

    set({ onboardingVisto: true });
    void SecureStore.setItemAsync(CLAVE, 'si');
  },

  olvidarOnboarding: () => {
    if (!__DEV__) return;

    set({ onboardingVisto: false });
    void SecureStore.deleteItemAsync(CLAVE);
  },
}));
