import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { TonoAcento } from '../../core/theme';

/**
 * PRECIOS Y CONTENIDO DEL PAYWALL
 *
 * Los textos y los precios separados de la pantalla, igual que `pasos.ts`
 * hace con el onboarding.
 *
 * ⚠️ ESTOS PRECIOS SON EL RESPALDO, no lo que se cobra. El precio real lo
 * fija la ficha del producto en Google Play y App Store, llega convertido a
 * la moneda del usuario, y desde el 25 de septiembre de 2026 el paywall se
 * lo pide a la tienda (ver `preciosMostrados`). Estos números solo se pintan
 * cuando no hay tienda a la que preguntar: Expo Go, iOS sin la clave de
 * Apple, o las suscripciones todavía sin crear en la consola.
 *
 * El ahorro NUNCA se escribe a mano: se calcula desde los dos precios (ver
 * `porcentajeAhorro`). Un porcentaje escrito a mano se queda desfasado en
 * cuanto alguien toca un precio, y anunciar un descuento que no es real es
 * causa de rechazo en las tiendas.
 */

export type IdPlan = 'ANUAL' | 'SEMANAL';

/** Cobros semanales que entran en un año. Base del cálculo del ahorro. */
const SEMANAS_POR_ANIO = 52;

export interface Plan {
  id: IdPlan;
  etiqueta: string;
  /** Emoji al lado del nombre, tal cual el diseño. */
  adorno?: string;
  subtitulo: string;
  tono: TonoAcento;
  icono: keyof typeof Ionicons.glyphMap;
  /** Precio de venta en dólares. */
  precio: number;
  /** Cómo se lee el cobro: "por año", "por semana". */
  periodo: string;
  /** Semanas que cubre un cobro. Sirve para comparar los dos planes. */
  semanasCubiertas: number;
  /**
   * Beneficios listados. La línea del ahorro NO va aquí: la arma la tarjeta
   * con el porcentaje calculado.
   */
  ventajas: readonly string[];
  /** Lleva la insignia "MÁS POPULAR" y viene preseleccionado. */
  destacado?: boolean;
  /**
   * Identificador del producto en las tiendas.
   *
   * TODO(pagos): tiene que coincidir exactamente con el ID de la suscripción
   * creada en Google Play Console y App Store Connect, y con el que se
   * registre en RevenueCat. Si no coinciden, la compra falla en silencio.
   */
  productoTienda: string;
}

const PLAN_ANUAL: Plan = {
  id: 'ANUAL',
  etiqueta: 'Plan Anual',
  adorno: '👑',
  subtitulo: 'Máximo poder. Mejores resultados.',
  tono: 'rosa',
  icono: 'diamond',
  precio: 32.5,
  periodo: 'por año',
  semanasCubiertas: SEMANAS_POR_ANIO,
  ventajas: [
    'Acceso a todas las funciones premium',
    'Prioridad en nuevas herramientas',
    'Cancela cuando quieras',
  ],
  destacado: true,
  productoTienda: 'candela_premium_anual',
};

const PLAN_SEMANAL: Plan = {
  id: 'SEMANAL',
  etiqueta: 'Plan Semanal',
  subtitulo: 'Flexibilidad para conquistar.',
  tono: 'purpura',
  icono: 'diamond',
  precio: 6.5,
  periodo: 'por semana',
  semanasCubiertas: 1,
  ventajas: [
    'Acceso completo a premium',
    'Respuestas ilimitadas',
    'Cancela cuando quieras',
  ],
  productoTienda: 'candela_premium_semanal',
};

/** El orden es el de la pantalla: el destacado primero. */
export const PLANES: readonly Plan[] = [PLAN_ANUAL, PLAN_SEMANAL];

export const PLAN_POR_DEFECTO: IdPlan = 'ANUAL';

/** Días de prueba que anuncia el pie. */
export const DIAS_DE_PRUEBA = 3;

// ── Cálculo del ahorro ────────────────────────────────────────────────────

/**
 * Lo que costaría el mismo periodo pagando semana a semana.
 *
 * Es el precio tachado del diseño (US$ 259.48 = 4.99 × 52). Se calcula para
 * que no pueda contradecir al precio semanal que se muestra dos tarjetas
 * más abajo.
 */
export function precioComparado(plan: Plan): number | null {
  if (plan.semanasCubiertas <= 1) return null;

  return redondear(PLAN_SEMANAL.precio * plan.semanasCubiertas);
}

/**
 * Porcentaje de ahorro frente a pagar semana a semana.
 *
 * Devuelve `null` cuando no hay ahorro que anunciar, y así la insignia
 * simplemente no se dibuja en vez de mostrar un 0%.
 */
export function porcentajeAhorro(plan: Plan): number | null {
  const referencia = precioComparado(plan);
  if (referencia === null) return null;

  const ahorro = Math.round((1 - plan.precio / referencia) * 100);
  return ahorro > 0 ? ahorro : null;
}

/** Precio en el formato del diseño: `39.99`. El "US$" lo pone la tarjeta. */
export function formatearPrecio(monto: number): string {
  return monto.toFixed(2);
}

function redondear(monto: number): number {
  return Math.round(monto * 100) / 100;
}

/// ── Precios que se muestran ───────────────────────────────────────────────

/**
 * Lo que la tienda dice que cuesta un plan, en la moneda del usuario.
 *
 * Lo llena `revenuecat.ts` desde las ofertas. `monto` sirve para calcular
 * —el ahorro, el precio tachado— y `texto` para mostrar, porque ya viene
 * formateado con el símbolo y los separadores del país.
 */
export interface PrecioTienda {
  monto: number;
  texto: string;
  /** ISO 4217: `USD`, `PEN`, `MXN`. */
  moneda: string;
}

/** Lo que pinta la tarjeta, ya resuelto. */
export interface PrecioMostrado {
  /**
   * El símbolo, cuando lo ponemos nosotros (`US$`). Es `null` con precios de
   * tienda: `monto` ya trae su moneda dentro, y partir "S/ 120.00" en dos
   * trozos es adivinar dónde acaba el símbolo de cada país.
   */
  moneda: string | null;
  /** El número grande. */
  monto: string;
  /** El precio tachado, o `null` si no hay con qué comparar. */
  comparado: string | null;
  /** El porcentaje de la insignia, o `null` si no hay ahorro real. */
  ahorro: number | null;
}

/**
 * QUÉ PRECIO SE ENSEÑA: el de la tienda si lo hay, el de respaldo si no.
 *
 * Los números de este archivo son para maquetar. El que se cobra lo fija la
 * ficha del producto, y llega convertido a la moneda de cada usuario: a
 * alguien en Perú, Google le cobra en soles, así que enseñarle "US$ 32.50"
 * es enseñarle un precio que no es el suyo. Mostrar uno distinto del que se
 * cobra va contra la política de las tiendas.
 *
 * **O los dos de la tienda, o los dos de respaldo — nunca mezclados.** El
 * ahorro es un cociente entre el anual y el semanal: sacado de un precio real
 * y otro inventado, anuncia un descuento que no existe, y eso sí que es
 * motivo de rechazo. Por eso, si la tienda solo contesta por uno de los dos,
 * se usan los de respaldo enteros.
 */
export function preciosMostrados(
  tienda: Record<string, PrecioTienda> | null,
): Record<IdPlan, PrecioMostrado> {
  const completos = PLANES.every((p) => tienda?.[p.productoTienda]);

  if (!completos || !tienda) {
    return {
      ANUAL: deRespaldo(PLAN_ANUAL),
      SEMANAL: deRespaldo(PLAN_SEMANAL),
    };
  }

  const semanal = tienda[PLAN_SEMANAL.productoTienda];

  return {
    ANUAL: deTienda(PLAN_ANUAL, tienda[PLAN_ANUAL.productoTienda], semanal),
    SEMANAL: deTienda(PLAN_SEMANAL, semanal, semanal),
  };
}

function deRespaldo(plan: Plan): PrecioMostrado {
  const comparado = precioComparado(plan);

  return {
    moneda: 'US$',
    monto: formatearPrecio(plan.precio),
    comparado: comparado === null ? null : `US$ ${formatearPrecio(comparado)}`,
    ahorro: porcentajeAhorro(plan),
  };
}

function deTienda(
  plan: Plan,
  suyo: PrecioTienda,
  semanal: PrecioTienda,
): PrecioMostrado {
  if (plan.semanasCubiertas <= 1) {
    return { moneda: null, monto: suyo.texto, comparado: null, ahorro: null };
  }

  const referencia = redondear(semanal.monto * plan.semanasCubiertas);
  const ahorro = Math.round((1 - suyo.monto / referencia) * 100);

  return {
    moneda: null,
    monto: suyo.texto,
    comparado: formatearMoneda(referencia, suyo.moneda),
    ahorro: ahorro > 0 ? ahorro : null,
  };
}

/**
 * Formatea el tachado —que lo calculamos nosotros— en la moneda del usuario,
 * para que no desentone con el precio que viene de la tienda.
 *
 * `Intl` podría no estar en algún entorno, así que el respaldo es el código
 * de moneda delante: "PEN 338.00" es feo, pero no engaña a nadie.
 */
function formatearMoneda(monto: number, moneda: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: moneda,
    }).format(monto);
  } catch {
    return `${moneda} ${monto.toFixed(2)}`;
  }
}

// ── Rejilla de ventajas de la cabecera ────────────────────────────────────


/**
 * Los cuatro iconos bajo el titular.
 *
 * La corona no existe en Ionicons, así que ese va con MaterialCommunityIcons
 * y por eso la familia viaja junto al nombre: mantiene el tipado de los
 * nombres de icono en las dos familias.
 */
export type IconoVentaja =
  | { familia: 'ionicons'; nombre: keyof typeof Ionicons.glyphMap }
  | {
      familia: 'material';
      nombre: keyof typeof MaterialCommunityIcons.glyphMap;
    };

export interface VentajaDestacada {
  icono: IconoVentaja;
  tono: TonoAcento;
  texto: string;
}

export const VENTAJAS: readonly VentajaDestacada[] = [
  {
    icono: { familia: 'ionicons', nombre: 'flame' },
    tono: 'rosa',
    texto: 'Respuestas ilimitadas',
  },
  {
    icono: { familia: 'ionicons', nombre: 'chatbubble-ellipses' },
    tono: 'purpura',
    texto: 'Todos los modos de respuesta',
  },
  {
    icono: { familia: 'ionicons', nombre: 'flash' },
    tono: 'azul',
    texto: 'Respuestas instantáneas',
  },
  {
    icono: { familia: 'material', nombre: 'crown' },
    tono: 'rose',
    texto: 'Nuevas funciones premium',
  },
];
