import Constants from 'expo-constants';

/**
 * Configuración global de la aplicación.
 *
 * Mismo rol que `lib/config/app_config.dart` en Ferova: un único lugar donde
 * vive la URL del backend y las banderas de entorno.
 *
 * Para apuntar a otro backend sin tocar código, crea un `.env` en `mobile/`:
 *
 *   EXPO_PUBLIC_API_URL=https://candela-produccion.up.railway.app/api/v1
 *
 * Expo expone al bundle solo las variables con prefijo `EXPO_PUBLIC_`. Las
 * demás se quedan fuera, que es lo correcto: cualquier cosa embebida en la
 * app es pública de hecho, así que ahí nunca van secretos.
 */

/**
 * En desarrollo, `localhost` NO funciona desde un celular físico: apunta al
 * propio teléfono, no a tu laptop. Expo ya conoce la IP de red local (es la
 * que aparece en el QR), así que la reutilizamos y evitamos que tengas que
 * escribirla a mano cada vez que cambies de WiFi.
 */
function urlDesarrollo(): string {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:3000/api/v1` : 'http://localhost:3000/api/v1';
}

export const AppConfig = {
  /** URL base del backend. */
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? urlDesarrollo(),

  /** `true` en Expo Go y builds de desarrollo, `false` en producción. */
  esDesarrollo: __DEV__,

  /** Corta las peticiones que se cuelgan. Generar tarda 3-6s; 60 da margen. */
  timeoutMs: 60_000,

  /** Ancho al que se comprimen las capturas antes de subirlas. */
  imagen: {
    anchoMaximo: 1080,
    calidad: 0.8,
  },
} as const;
