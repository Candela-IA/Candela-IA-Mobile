import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

/**
 * PREFERENCIAS DE PERSONALIZACIÓN
 *
 * Los tres interruptores de Ajustes → Personalización. Se guardan en el
 * teléfono para que sobrevivan a cerrar la app: un ajuste que se olvida al
 * reiniciar no es un ajuste.
 *
 * Se usa `expo-secure-store` en lugar de AsyncStorage porque ya está
 * instalado (lo usa la sesión) y esto evita añadir una dependencia nativa
 * nueva, que obligaría a reinstalar y reconstruir. No son secretos, pero
 * caben de sobra: el límite por clave son 2 KB y esto son tres booleanos.
 */

const CLAVE = 'candela.preferencias';

export interface Preferencias {
  /** Auras de color latiendo detrás del contenido. */
  animacionesFondo: boolean;
  /** Los destellos que suben lentamente por la pantalla. */
  particulasFlotantes: boolean;
  /** El resplandor de iconos y tarjetas. */
  brilloNeon: boolean;
}

const POR_DEFECTO: Preferencias = {
  animacionesFondo: true,
  particulasFlotantes: true,
  brilloNeon: true,
};

interface EstadoPreferencias extends Preferencias {
  /**
   * `false` hasta que se lee el disco. Sirve para no pintar la primera
   * pantalla con los valores por defecto y corregirlos un instante después,
   * que se vería como un parpadeo.
   */
  cargadas: boolean;
  cargar: () => Promise<void>;
  alternar: (clave: keyof Preferencias) => void;
}

export const usarPreferencias = create<EstadoPreferencias>((set, get) => ({
  ...POR_DEFECTO,
  cargadas: false,

  cargar: async () => {
    if (get().cargadas) return;

    try {
      const guardadas = await SecureStore.getItemAsync(CLAVE);

      if (guardadas) {
        // Se mezcla sobre los valores por defecto en vez de sustituirlos:
        // si mañana se añade un interruptor nuevo, lo guardado antes no lo
        // tendrá y quedaría en `undefined`.
        set({ ...POR_DEFECTO, ...JSON.parse(guardadas), cargadas: true });
        return;
      }
    } catch {
      // Un JSON corrupto o un almacén ilegible no puede impedir que la app
      // arranque: se sigue con los valores por defecto.
    }

    set({ cargadas: true });
  },

  alternar: (clave) => {
    const valor = !get()[clave];
    set({ [clave]: valor } as Pick<Preferencias, typeof clave>);

    const { animacionesFondo, particulasFlotantes, brilloNeon } = get();

    // Se guarda sin esperar: el interruptor tiene que responder al instante,
    // y si la escritura falla lo peor que pasa es que se pierda el ajuste.
    void SecureStore.setItemAsync(
      CLAVE,
      JSON.stringify({ animacionesFondo, particulasFlotantes, brilloNeon }),
    );
  },
}));
