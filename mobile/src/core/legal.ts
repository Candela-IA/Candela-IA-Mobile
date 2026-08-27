import { Alert, Linking } from 'react-native';

/**
 * ENLACES LEGALES Y DE SOPORTE
 *
 * Viven en un solo sitio porque los piden dos pantallas: el paywall (donde
 * las tiendas los exigen) y Ajustes.
 *
 * Apple no aprueba una app de suscripción sin términos de uso y política de
 * privacidad enlazados desde la pantalla de compra (guía de revisión 3.1.2),
 * y Google pide lo mismo. Mientras las URL estén vacías, la app avisa en vez
 * de abrir un enlace roto.
 *
 * TODO(cliente): pedir las dos URL publicadas.
 */

export const ENLACES_LEGALES = {
  terminos: '',
  privacidad: '',
} as const;

export type TipoEnlaceLegal = keyof typeof ENLACES_LEGALES;

const CORREO_SOPORTE = 'soporte.candela.ia@gmail.com';

export function abrirEnlaceLegal(cual: TipoEnlaceLegal) {
  const url = ENLACES_LEGALES[cual];

  if (!url) {
    Alert.alert(
      'Enlace pendiente',
      'Falta que el cliente entregue la URL de términos de uso y de política ' +
        'de privacidad. Las dos tienen que estar publicadas antes de enviar ' +
        'la app a revisión.',
    );
    return;
  }

  void Linking.openURL(url);
}

/**
 * Abre el correo del teléfono con el mensaje ya empezado.
 *
 * El prototipo web abría Gmail en una pestaña; en un celular lo correcto es
 * `mailto:`, que deja elegir la app de correo que el usuario ya tiene.
 */
export async function contactarSoporte() {
  const asunto = encodeURIComponent('Soporte Candela IA');
  const cuerpo = encodeURIComponent(
    'Hola equipo de Candela IA,\n\nMe pongo en contacto porque…\n',
  );

  const url = `mailto:${CORREO_SOPORTE}?subject=${asunto}&body=${cuerpo}`;

  // Se abre directamente, sin preguntar antes con `canOpenURL`.
  //
  // Desde Android 11 una app no puede consultar qué otras apps hay
  // instaladas si no declara `<queries>` en el manifiesto. `canOpenURL`
  // devuelve `false` aunque el teléfono tenga Gmail perfectamente
  // configurado, así que la comprobación previa hacía lo contrario de lo que
  // pretendía: enseñaba "Sin app de correo" a gente que sí la tiene, y el
  // botón parecía roto.
  //
  // `openURL` sí funciona: lanza el intent y deja que Android resuelva quién
  // lo atiende. Si de verdad no hay nadie, lanza excepción, y ahí sí toca el
  // aviso con el correo a mano.
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Sin app de correo',
      `Escríbenos a ${CORREO_SOPORTE} desde donde prefieras.`,
    );
  }
}
