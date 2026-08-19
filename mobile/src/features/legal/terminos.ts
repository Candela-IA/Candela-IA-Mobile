import { Ionicons } from '@expo/vector-icons';

import { TonoAcento } from '../../core/theme';
import { formatearPrecio, PLANES } from '../premium/planes';

/**
 * TÉRMINOS DE USO
 *
 * El texto es el que redactó el cliente en el prototipo de Figma, portado
 * tal cual. Separado de la pantalla para que corregir una frase no obligue
 * a tocar código de presentación — y porque un texto legal se revisa leyendo
 * un archivo de texto, no buscando entre JSX.
 *
 * ⚠️ Esto NO sustituye a la política de privacidad, que sigue pendiente y
 * es un documento distinto que las tiendas exigen por separado.
 */

/** Un párrafo corriente o una viñeta con guion. */
export type Bloque = { readonly p: string } | { readonly item: string };

export interface SeccionTerminos {
  readonly numero: number;
  readonly titulo: string;
  readonly icono: keyof typeof Ionicons.glyphMap;
  readonly tono: TonoAcento;
  readonly bloques: readonly Bloque[];
}

export const VERSION_TERMINOS = '1.0.0';

export const INTRODUCCION =
  'Bienvenido a Candela IA. Estos Términos regulan el acceso y uso de la ' +
  'app, sus funciones de inteligencia artificial y los servicios premium. ' +
  'Al registrarte, acceder o usar Candela IA confirmas que los has leído, ' +
  'comprendido y aceptado. Si no estás de acuerdo, debes dejar de utilizar ' +
  'la aplicación.';

export const CORREO_SOPORTE = 'soporte.candela.ia@gmail.com';

/**
 * Las líneas de precio se arman desde el catálogo de planes, nunca a mano.
 *
 * Los términos y el paywall tienen que decir lo mismo: una cifra distinta
 * en cada sitio es exactamente el tipo de contradicción que las tiendas
 * rechazan, y con el precio escrito dos veces es cuestión de tiempo que
 * alguien actualice solo uno.
 */
const LINEAS_DE_PRECIO: readonly Bloque[] = PLANES.map((plan) => ({
  item: `${plan.etiqueta}: US$ ${formatearPrecio(plan.precio)} ${plan.periodo}.`,
}));

export const SECCIONES: readonly SeccionTerminos[] = [
  {
    numero: 1,
    titulo: 'Sobre Candela IA',
    icono: 'sparkles',
    tono: 'rosa',
    bloques: [
      {
        p: 'Candela IA usa inteligencia artificial para ayudarte a mejorar tus conversaciones y tu comunicación. Entre sus funciones:',
      },
      { item: 'Análisis de conversaciones y de capturas de pantalla.' },
      { item: 'Generación de respuestas y de rompehielos.' },
      { item: 'Creación de notas para redes sociales.' },
      { item: 'Análisis de Stories que tú proporcionas.' },
      { item: 'Funciones premium mediante suscripción.' },
      { p: 'Las funciones pueden cambiar, ampliarse o retirarse con el tiempo.' },
    ],
  },
  {
    numero: 2,
    titulo: 'Quién puede usarla',
    icono: 'person',
    tono: 'azul',
    bloques: [
      {
        p: 'Para usar Candela IA debes tener como mínimo 18 años. La app está destinada únicamente a personas mayores de edad. Si detectamos un uso por debajo de esa edad, podremos restringir o cancelar la cuenta.',
      },
    ],
  },
  {
    numero: 3,
    titulo: 'Tu cuenta',
    icono: 'lock-closed',
    tono: 'cian',
    bloques: [
      {
        p: 'Al crear una cuenta debes dar información veraz y actualizada. Eres responsable de:',
      },
      { item: 'Mantener la seguridad de tus credenciales.' },
      { item: 'No compartir tu cuenta ni usar la de otras personas.' },
      { item: 'Avisarnos de cualquier acceso no autorizado.' },
    ],
  },
  {
    numero: 4,
    titulo: 'Uso de la inteligencia artificial',
    icono: 'sparkles',
    tono: 'purpura',
    bloques: [
      { p: 'Las respuestas generadas por IA:' },
      { item: 'Pueden contener errores o no ser adecuadas para toda situación.' },
      { item: 'No son asesoramiento profesional.' },
      {
        item: 'No garantizan un resultado en una conversación, cita o relación.',
      },
      { p: 'Tú decides si usas, modificas o descartas cada respuesta.' },
    ],
  },
  {
    numero: 5,
    titulo: 'Capturas y conversaciones',
    icono: 'image',
    tono: 'rosa',
    bloques: [
      {
        p: 'Al subir capturas, Stories u otras imágenes declaras que tienes derecho a usarlas y que no infringes derechos de terceros. Como pueden contener datos de otras personas, oculta antes de subir información innecesaria o sensible como:',
      },
      { item: 'Contraseñas, códigos de acceso o información bancaria.' },
      { item: 'Documentos de identidad, información financiera o médica.' },
      {
        p: 'Usaremos el contenido solo para prestar la función pedida, según la Política de Privacidad.',
      },
    ],
  },
  {
    numero: 6,
    titulo: 'Uso permitido',
    icono: 'ban',
    tono: 'azul',
    bloques: [
      {
        p: 'Puedes usar Candela IA con fines personales y legítimos. No puedes usarla para:',
      },
      {
        item: 'Actividades ilegales, acoso, amenazas o suplantación de identidad.',
      },
      {
        item: 'Distribuir malware o acceder sin autorización a nuestros sistemas.',
      },
      {
        item: 'Evadir límites o seguridad, ni abusar del servicio con sistemas automatizados.',
      },
      {
        item: 'Vulnerar los derechos de terceros o generar contenido para cometer delitos.',
      },
      {
        p: 'Podremos tomar medidas ante usos que violen estos Términos o la ley.',
      },
    ],
  },
  {
    numero: 7,
    titulo: 'Tu contenido y el generado por IA',
    icono: 'documents',
    tono: 'cian',
    bloques: [
      {
        p: 'Conservas los derechos que legalmente te correspondan sobre el contenido que aportas; solo nos das las autorizaciones necesarias para procesarlo y prestarte el servicio. No adquirimos la propiedad de tus conversaciones ni fotos por usarlas en la app.',
      },
      {
        p: 'El contenido generado por la IA puede tener errores o interpretaciones equivocadas, así que revísalo antes de utilizarlo.',
      },
    ],
  },
  {
    numero: 8,
    titulo: 'Redes sociales y terceros',
    icono: 'shield-checkmark',
    tono: 'purpura',
    bloques: [
      {
        p: 'Candela IA no es propietaria ni está afiliada, patrocinada o respaldada por Instagram, TikTok, Facebook u otras plataformas, salvo indicación expresa. Las marcas y logotipos pertenecen a sus titulares y debes cumplir las condiciones de cada plataforma que uses.',
      },
    ],
  },
  {
    numero: 9,
    titulo: 'Suscripciones premium',
    icono: 'diamond',
    tono: 'rosa',
    bloques: [
      ...LINEAS_DE_PRECIO,
      {
        p: 'Precios, impuestos, promociones y condiciones de renovación pueden variar y se muestran antes de comprar. Lo que aparece en la pantalla de compra prevalece sobre estos ejemplos si hay diferencias.',
      },
    ],
  },
  {
    numero: 10,
    titulo: 'Renovación, pruebas y pagos',
    icono: 'refresh',
    tono: 'azul',
    bloques: [
      {
        item: 'Las suscripciones con renovación automática se renuevan según las reglas de la tienda donde compraste.',
      },
      {
        item: 'Puedes cancelar la renovación siguiendo las instrucciones de Apple, Google u otro proveedor.',
      },
      {
        item: 'Cuando una prueba gratuita pase a ser de pago, se te informará claramente antes de confirmar.',
      },
      {
        item: 'La cancelación no implica necesariamente el reembolso de períodos ya pagados, salvo cuando la ley lo exija.',
      },
    ],
  },
  {
    numero: 11,
    titulo: 'Pagos',
    icono: 'card',
    tono: 'cian',
    bloques: [
      {
        p: 'Los pagos se procesan mediante plataformas externas; no necesitamos almacenar los datos completos de tu tarjeta. Podemos recibir datos de la compra como el identificador de transacción, el tipo de suscripción, la fecha y el estado de la misma.',
      },
    ],
  },
  {
    numero: 12,
    titulo: 'Propiedad intelectual',
    icono: 'reader',
    tono: 'purpura',
    bloques: [
      {
        p: 'El nombre, logotipo, diseño, interfaz, código y demás componentes de Candela IA pertenecen a sus titulares. Salvo autorización expresa o cuando la ley lo permita, no puedes copiar, redistribuir, vender, modificar ni crear servicios derivados de la app, ni usar nuestra marca de forma que genere confusión.',
      },
    ],
  },
  {
    numero: 13,
    titulo: 'Disponibilidad y responsabilidad',
    icono: 'shield-checkmark',
    tono: 'rosa',
    bloques: [
      {
        p: 'Trabajamos para mantener la app disponible, pero pueden ocurrir interrupciones por mantenimiento, actualizaciones, fallos técnicos o causas ajenas a nosotros. No garantizamos que la app funcione sin interrupciones ni que las respuestas de IA sean siempre correctas o adecuadas.',
      },
      {
        p: 'Nada en estos Términos excluye derechos que no puedan limitarse legalmente; se respeta el Código de Protección y Defensa del Consumidor peruano frente a cláusulas abusivas.',
      },
    ],
  },
  {
    numero: 14,
    titulo: 'Suspensión de cuentas',
    icono: 'ban',
    tono: 'azul',
    bloques: [
      {
        p: 'Podemos suspender o cancelar una cuenta ante incumplimientos, fraude, abuso, intentos de vulnerar nuestros sistemas, actividades ilegales o riesgos de seguridad. Cuando corresponda, procuraremos informarte y respetar tus derechos legales.',
      },
    ],
  },
  {
    numero: 15,
    titulo: 'Privacidad y cambios',
    icono: 'sparkles',
    tono: 'cian',
    bloques: [
      {
        p: 'El tratamiento de tus datos se rige por nuestra Política de Privacidad, alineada con la Ley N.º 29733 y su Reglamento (D.S. 016-2024-JUS). Podemos actualizar la app y estos Términos; ante cambios importantes indicaremos la nueva fecha y, cuando la ley lo exija, te pediremos aceptarlos de nuevo.',
      },
    ],
  },
  {
    numero: 16,
    titulo: 'Legislación aplicable',
    icono: 'shield-checkmark',
    tono: 'purpura',
    bloques: [
      {
        p: 'Estos Términos se interpretan conforme a la legislación peruana, sin perjuicio de los derechos irrenunciables que correspondan al consumidor.',
      },
    ],
  },
];
