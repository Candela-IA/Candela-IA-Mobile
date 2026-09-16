import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { consultarSaldo } from '../../core/api/candela';
import { useSesion } from '../../core/di/sesion';
import { abrirEnlaceLegal, TipoEnlaceLegal } from '../../core/legal';
import { mostrarAviso } from '../../core/ui/Aviso';
import { IdPlan, PLANES } from './planes';
import { comprarPlan, restaurarCompras } from './revenuecat';

/**
 * COMPRA DE LA SUSCRIPCIÓN.
 *
 * Las suscripciones digitales se cobran por Google Play Billing; ninguna
 * tienda deja cobrarlas por fuera. La integración va con RevenueCat, que
 * además necesita un build nativo: dentro de Expo Go no existe el módulo, y
 * por eso `revenuecat.ts` responde `sin_tienda` en vez de reventar.
 *
 * QUIÉN CONCEDE PREMIUM: el backend, cuando RevenueCat se lo cuenta por el
 * webhook. Nunca esta pantalla. Aquí solo se lanza la compra y luego se le
 * pregunta al backend por el saldo, igual que hace el resto de la app.
 *
 * Eso tiene una consecuencia visible que hay que tratar bien: entre que
 * Google cobra y el webhook llega pasan unos segundos. Por eso después de
 * comprar no se pregunta una vez, se pregunta varias.
 */

/** Cuántas veces se le pregunta al backend si ya llegó el webhook. */
const INTENTOS_CONFIRMACION = 6;
const ESPERA_ENTRE_INTENTOS_MS = 1500;

export function usarCompra() {
  const router = useRouter();
  const { token, actualizarSaldo } = useSesion();

  const [procesando, setProcesando] = useState(false);

  /**
   * Espera a que el backend reconozca la suscripción.
   *
   * Devuelve `true` si llegó a tiempo. Un `false` NO significa que la compra
   * fallara: significa que el webhook todavía venía en camino, y al usuario
   * hay que decírselo de otra forma — su dinero sí se movió.
   */
  const esperarConfirmacion = useCallback(
    async (jwt: string): Promise<boolean> => {
      for (let intento = 0; intento < INTENTOS_CONFIRMACION; intento++) {
        try {
          const saldo = await consultarSaldo(jwt);
          actualizarSaldo(saldo);
          if (saldo.esPremium) return true;
        } catch {
          // Un fallo de red aquí no cambia nada: se reintenta en la vuelta
          // siguiente y, si no, el saldo se refresca solo al volver a la app.
        }

        await new Promise((listo) =>
          setTimeout(listo, ESPERA_ENTRE_INTENTOS_MS),
        );
      }

      return false;
    },
    [actualizarSaldo],
  );

  const comprar = useCallback(
    async (idPlan: IdPlan) => {
      const plan = PLANES.find((p) => p.id === idPlan);
      if (!plan || procesando) return;

      setProcesando(true);

      try {
        const resultado = await comprarPlan(plan.productoTienda);

        switch (resultado.estado) {
          // Cerró la hoja de Google Play. Decidió que no, y decirle algo
          // sería insistirle a alguien que ya se pronunció.
          case 'cancelada':
            return;

          case 'sin_tienda':
            mostrarAviso(
              'Pagos no disponibles aquí',
              'Esta versión de la app no puede cobrar. Instala la de Google ' +
                'Play para suscribirte.',
            );
            return;

          case 'error':
            mostrarAviso('No pudimos completar la compra', resultado.mensaje);
            return;

          case 'comprada': {
            const confirmada = token
              ? await esperarConfirmacion(token)
              : false;

            mostrarAviso(
              confirmada ? '¡Ya eres premium!' : 'Compra recibida',
              confirmada
                ? 'Todos los modos están desbloqueados. A por ello.'
                : 'Tu pago se registró correctamente. El acceso premium se ' +
                    'activa en unos segundos; si no lo ves, cierra la app y ' +
                    'vuelve a abrirla.',
            );

            router.back();
          }
        }
      } finally {
        setProcesando(false);
      }
    },
    [procesando, token, esperarConfirmacion, router],
  );

  const restaurar = useCallback(async () => {
    if (procesando) return;

    setProcesando(true);

    try {
      const resultado = await restaurarCompras();

      if (resultado.estado === 'sin_tienda') {
        mostrarAviso(
          'Pagos no disponibles aquí',
          'Esta versión de la app no puede consultar tus compras. Usa la de ' +
            'Google Play.',
        );
        return;
      }

      if (resultado.estado === 'error') {
        mostrarAviso('No pudimos restaurar', resultado.mensaje);
        return;
      }

      const confirmada = token ? await esperarConfirmacion(token) : false;

      if (confirmada) {
        mostrarAviso(
          'Suscripción restaurada',
          'Volviste a tener acceso a todo lo premium.',
        );
        router.back();
        return;
      }

      // Restaurar sin nada que restaurar es el caso normal de quien nunca
      // pagó, así que no se le habla de errores.
      mostrarAviso(
        'No encontramos una suscripción',
        'No hay ninguna compra activa en esta cuenta de Google. Si pagaste ' +
          'con otra, inicia sesión con esa en el teléfono.',
      );
    } finally {
      setProcesando(false);
    }
  }, [procesando, token, esperarConfirmacion, router]);

  // Los enlaces viven en `core/legal` porque Ajustes muestra los mismos, y
  // dos copias del mismo dato acaban divergiendo.
  const abrirLegal = useCallback((cual: TipoEnlaceLegal) => {
    abrirEnlaceLegal(cual);
  }, []);

  return {
    comprar,
    restaurar,
    abrirLegal,
    /** `true` mientras la tienda procesa el cobro. */
    procesando,
  };
}
