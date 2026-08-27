import * as StoreReview from 'expo-store-review';
import { Alert, Linking, Platform } from 'react-native';

/**
 * "Tu opinión": pedirle al usuario que califique la app.
 *
 * LO QUE HAY QUE SABER ANTES DE TOCAR ESTO
 *
 * El diálogo de estrellas de Android (In-App Review) NO es algo que la app
 * dibuje: lo pinta Google Play por encima. Y solo lo hace si se cumplen sus
 * condiciones, que nosotros no controlamos:
 *
 *   · La app tiene que haberse instalado DESDE Google Play. En un APK
 *     instalado a mano no aparece nunca.
 *   · Play limita cuántas veces al año se le puede enseñar a la misma
 *     persona, y no dice cuándo. Puede no salir aunque todo esté bien.
 *   · No hay forma de saber si el usuario calificó, ni con cuántas
 *     estrellas. Google lo oculta a propósito para que nadie premie las
 *     valoraciones buenas.
 *
 * Por eso esto NO se puede probar con el APK de pruebas, y por eso la
 * función cae hacia la ficha de la tienda cuando el diálogo no está
 * disponible: así el usuario siempre acaba en un sitio donde puede poner sus
 * estrellas, aunque sea saliendo de la app.
 */

/** Coincide con `android.package` de app.json. */
const PAQUETE_ANDROID = 'com.candelaia.app';

/**
 * Ficha en Google Play.
 *
 * `market://` abre la app de Play directamente, sin pasar por el navegador.
 * Si no está instalada —un emulador, un móvil sin servicios de Google—,
 * `openURL` lanza y se recurre a la web.
 */
const URL_TIENDA = `market://details?id=${PAQUETE_ANDROID}`;
const URL_TIENDA_WEB = `https://play.google.com/store/apps/details?id=${PAQUETE_ANDROID}`;

export async function valorarApp(): Promise<void> {
  // 1. El diálogo nativo, que es la mejor opción: el usuario califica sin
  //    salir de la app y vuelve justo donde estaba.
  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      return;
    }
  } catch {
    // Si Play lo rechaza por sus propias reglas, no es un error que deba
    // ver el usuario: se sigue con la ficha de la tienda.
  }

  // 2. La ficha de la tienda. Las estrellas están ahí igual, solo que
  //    saliendo de la app.
  try {
    await Linking.openURL(URL_TIENDA);
    return;
  } catch {
    // Sin la app de Play instalada.
  }

  try {
    await Linking.openURL(URL_TIENDA_WEB);
    return;
  } catch {
    // Sin navegador tampoco. Raro, pero pasa en dispositivos capados.
  }

  // 3. Nada funcionó. Antes que dejar el botón muerto, se dice la verdad.
  Alert.alert(
    'Todavía no se puede',
    Platform.OS === 'android'
      ? 'Podrás calificarnos desde Google Play cuando la app esté publicada. ' +
          'Mientras tanto, escríbenos desde Contáctanos y lo leemos.'
      : 'Podrás calificarnos desde el App Store cuando la app esté publicada.',
  );
}
