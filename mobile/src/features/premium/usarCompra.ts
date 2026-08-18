import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';

import { ENLACES_LEGALES, IdPlan, PLANES } from './planes';

/**
 * COMPRA DE LA SUSCRIPCIÓN — todavía sin conectar.
 *
 * Las suscripciones digitales tienen que cobrarse por Google Play Billing y
 * Apple IAP; ninguna tienda deja cobrarlas por fuera. La integración va con
 * RevenueCat (`react-native-purchases`), que además necesita un build nativo:
 * dentro de Expo Go no funciona, porque Expo Go no trae ese módulo.
 *
 * ⚠️ HASTA ENTONCES, ESTE MÓDULO NO CONCEDE PREMIUM A NADIE. Es deliberado.
 * Un atajo que active premium sin pasar por la tienda es justo el bug que no
 * puede llegar a producción, y "lo quito antes de publicar" es una promesa
 * que se olvida. Cuando exista el flujo real, premium se activará por el
 * webhook de RevenueCat contra el backend, nunca desde la app.
 *
 * Lo que falta, en orden:
 *   1. Crear las suscripciones en Play Console y App Store Connect con los
 *      IDs de `productoTienda`.
 *   2. `npx expo install react-native-purchases` y un build de desarrollo.
 *   3. Reemplazar los avisos de abajo por `Purchases.purchasePackage()` y
 *      `Purchases.restorePurchases()`.
 *   4. Webhook de RevenueCat → backend → tabla `subscriptions`.
 */

const TITULO_PENDIENTE = 'Pagos aún no conectados';

export function usarCompra() {
  const comprar = useCallback((idPlan: IdPlan) => {
    const plan = PLANES.find((p) => p.id === idPlan);

    Alert.alert(
      TITULO_PENDIENTE,
      `Aquí se abrirá el cobro de Google Play o App Store para el ` +
        `${plan?.etiqueta ?? idPlan}.\n\n` +
        'Falta integrar RevenueCat y generar un build nativo — dentro de ' +
        'Expo Go la compra no puede funcionar.',
    );
  }, []);

  const restaurar = useCallback(() => {
    Alert.alert(
      TITULO_PENDIENTE,
      'Restaurar compras devuelve la suscripción a quien ya pagó y cambió ' +
        'de teléfono. Se activa junto con el resto del cobro.',
    );
  }, []);

  const abrirLegal = useCallback((cual: keyof typeof ENLACES_LEGALES) => {
    const url = ENLACES_LEGALES[cual];

    if (!url) {
      Alert.alert(
        'Enlace pendiente',
        'Falta que el cliente entregue la URL de términos y de política de ' +
          'privacidad. Las dos tienen que estar publicadas antes de enviar ' +
          'la app a revisión.',
      );
      return;
    }

    void Linking.openURL(url);
  }, []);

  return {
    comprar,
    restaurar,
    abrirLegal,
    /** Se pondrá en `true` mientras la tienda procesa el cobro. */
    procesando: false,
  };
}
