import Constants from 'expo-constants';

import { AppConfig } from '../../config/app_config';

/**
 * LA TIENDA, AISLADA DEL RESTO DE LA APP.
 *
 * `react-native-purchases` es un módulo NATIVO: existe en un build de EAS y
 * no existe en Expo Go, que trae sus propios módulos y no incluye este. Como
 * el día a día del desarrollo es Expo Go, importarlo a pelo dejaría la app
 * sin arrancar en la mitad de las sesiones de trabajo.
 *
 * Por eso todo pasa por aquí: se carga a demanda, dentro de un try, y si no
 * está se devuelve `null`. Quien llama decide qué hacer con eso — en la app
 * significa enseñar un aviso en vez de reventar.
 *
 * LO QUE ESTE ARCHIVO NO HACE, Y NO DEBE HACER: conceder premium. La compra
 * termina en la tienda; quien decide si alguien es premium es el backend,
 * cuando RevenueCat se lo cuenta por el webhook. Cualquier atajo que active
 * premium desde el teléfono es premium gratis para quien sepa mirar el
 * tráfico de la app.
 */

/** Expo Go se identifica así; ahí el módulo nativo no está. */
const EN_EXPO_GO = Constants.executionEnvironment === 'storeClient';

type ModuloPurchases = typeof import('react-native-purchases');

let modulo: ModuloPurchases | null = null;
let configurado = false;

/**
 * Carga el módulo nativo si se puede.
 *
 * El `require` va dentro de la función y no arriba del archivo para que en
 * Expo Go ni siquiera se intente resolver.
 */
function cargar(): ModuloPurchases | null {
  if (EN_EXPO_GO) return null;
  if (modulo) return modulo;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    modulo = require('react-native-purchases') as ModuloPurchases;
    return modulo;
  } catch {
    return null;
  }
}

/** ¿Se puede comprar en este build? */
export function pagosDisponibles(): boolean {
  return cargar() !== null;
}

/**
 * Arranca RevenueCat con la identidad del dispositivo.
 *
 * El `appUserID` es EL MISMO `deviceKey` con el que la app se registra en el
 * backend, y eso no es un detalle: cuando llegue el webhook diciendo "este
 * usuario compró", el backend busca por esa clave. Si aquí se dejara que
 * RevenueCat generara un id anónimo propio, la compra llegaría a nombre de
 * alguien que el backend no conoce y el premium no se concedería nunca.
 *
 * Es idempotente: llamarla dos veces no hace nada la segunda.
 */
export async function configurarPagos(deviceKey: string): Promise<void> {
  const rc = cargar();
  if (!rc || configurado) return;

  try {
    await rc.default.configure({
      apiKey: AppConfig.revenueCatAndroid,
      appUserID: deviceKey,
    });
    configurado = true;
  } catch (e) {
    // No se relanza: quedarse sin tienda es molesto, pero no puede impedir
    // que la app arranque y genere mensajes, que es lo que viene a hacer.
    if (AppConfig.esDesarrollo) {
      console.warn('[pagos] No pude configurar RevenueCat', e);
    }
  }
}

export type ResultadoCompra =
  | { estado: 'comprada' }
  /** Cerró la hoja de Google Play. No es un error y no se le avisa de nada. */
  | { estado: 'cancelada' }
  | { estado: 'sin_tienda' }
  | { estado: 'error'; mensaje: string };

/**
 * Lanza la compra de un plan.
 *
 * El identificador que se recibe es el de `planes.ts` — el mismo que se creó
 * en Play Console. Se busca por prefijo y no por igualdad porque Google
 * devuelve el producto como `id_del_producto:id_del_plan_base`, así que un
 * `===` fallaría justo cuando todo lo demás está bien.
 */
export async function comprarPlan(
  productoTienda: string,
): Promise<ResultadoCompra> {
  const rc = cargar();
  if (!rc) return { estado: 'sin_tienda' };

  try {
    const ofertas = await rc.default.getOfferings();

    const paquetes = [
      ...(ofertas.current?.availablePackages ?? []),
      ...Object.values(ofertas.all).flatMap((o) => o.availablePackages),
    ];

    const paquete = paquetes.find((p) =>
      p.product.identifier.startsWith(productoTienda),
    );

    if (!paquete) {
      return {
        estado: 'error',
        mensaje:
          'Ese plan todavía no está disponible en la tienda. Vuelve a ' +
          'intentarlo en un momento.',
      };
    }

    await rc.default.purchasePackage(paquete);
    return { estado: 'comprada' };
  } catch (e) {
    if (esCancelacion(e)) return { estado: 'cancelada' };

    return {
      estado: 'error',
      mensaje: 'No pudimos completar la compra. Intenta de nuevo.',
    };
  }
}

/** Devuelve la suscripción a quien ya pagó y cambió de teléfono. */
export async function restaurarCompras(): Promise<ResultadoCompra> {
  const rc = cargar();
  if (!rc) return { estado: 'sin_tienda' };

  try {
    await rc.default.restorePurchases();
    return { estado: 'comprada' };
  } catch (e) {
    if (esCancelacion(e)) return { estado: 'cancelada' };

    return {
      estado: 'error',
      mensaje: 'No pudimos restaurar tus compras. Intenta de nuevo.',
    };
  }
}

/**
 * Cerrar la hoja de pago llega como error, con una bandera que lo distingue.
 *
 * Tratarlo como fallo sería decirle "no pudimos completar la compra" a quien
 * acaba de decidir por su cuenta que no la quería.
 */
function esCancelacion(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'userCancelled' in e &&
    Boolean((e as { userCancelled?: boolean }).userCancelled)
  );
}
