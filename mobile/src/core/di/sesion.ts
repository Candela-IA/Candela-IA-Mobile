import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { AppConfig } from '../../config/app_config';
import { registrarDispositivo, SaldoApi } from '../api/candela';

/**
 * Sesión del dispositivo.
 *
 * Candela no pide correo ni contraseña: la identidad ES el dispositivo. Este
 * módulo resuelve esa identidad, la canjea por un token en el backend y
 * mantiene el saldo de créditos que pintan las pantallas.
 */

const CLAVE_TOKEN = 'candela.token';
const CLAVE_DEVICE_KEY = 'candela.deviceKey';

/**
 * Identificador estable del dispositivo.
 *
 * Android: `ANDROID_ID` sobrevive a desinstalar la app.
 * iOS: no existe equivalente (`IDFV` se borra al desinstalar), así que se
 * genera un UUID y se guarda en Keychain, que sí persiste.
 *
 * En ambos casos el objetivo es el mismo: que reinstalar la app no regale
 * cinco intentos gratis nuevos.
 */
async function obtenerDeviceKey(): Promise<string> {
  const guardada = await SecureStore.getItemAsync(CLAVE_DEVICE_KEY);
  if (guardada) return guardada;

  let clave: string;

  if (Platform.OS === 'android') {
    clave = Application.getAndroidId() ?? generarUuid();
  } else {
    clave = generarUuid();
  }

  await SecureStore.setItemAsync(CLAVE_DEVICE_KEY, clave);
  return clave;
}

function generarUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface EstadoSesion {
  token: string | null;
  saldo: SaldoApi | null;
  cargando: boolean;
  error: string | null;

  /** Registra el dispositivo y obtiene token. Idempotente. */
  iniciar: () => Promise<void>;
  /** Refresca el saldo tras generar o comprar suscripción. */
  actualizarSaldo: (saldo: SaldoApi) => void;
  /**
   * SOLO DESARROLLO. Enciende premium en el saldo que la app tiene en
   * memoria, para poder revisar los tonos y pantallas premium sin pagar.
   *
   * No desbloquea nada de verdad: el backend sigue cobrando créditos y
   * respondiendo 402 cuando se acaben. Es una ayuda visual, no un atajo.
   * Fuera de desarrollo no hace nada, y el interruptor que la llama tampoco
   * se dibuja.
   */
  simularPremium: (valor: boolean) => void;
}

export const useSesion = create<EstadoSesion>((set, get) => ({
  token: null,
  saldo: null,
  cargando: false,
  error: null,

  iniciar: async () => {
    if (get().token || get().cargando) return;

    set({ cargando: true, error: null });

    try {
      const deviceKey = await obtenerDeviceKey();

      const sesion = await registrarDispositivo({
        deviceKey,
        plataforma: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        appVersion: Application.nativeApplicationVersion ?? undefined,
      });

      await SecureStore.setItemAsync(CLAVE_TOKEN, sesion.token);

      set({ token: sesion.token, saldo: sesion.saldo, cargando: false });
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'No pudimos conectar con el servidor.';

      set({ cargando: false, error: mensaje });

      if (AppConfig.esDesarrollo) {
        console.warn(
          `[sesion] Falló el registro contra ${AppConfig.baseUrl}. ` +
            '¿Está corriendo el backend y en la misma red?',
          e,
        );
      }
    }
  },

  actualizarSaldo: (saldo) => set({ saldo }),

  simularPremium: (valor) => {
    if (!AppConfig.esDesarrollo) return;

    const saldo = get().saldo;
    if (!saldo) return;

    set({ saldo: { ...saldo, esPremium: valor } });
  },
}));
