/**
 * BANCO DE ROMPEHIELOS
 *
 * El tono Básico de Rompehielos no llama a la IA: devuelve uno de estos.
 *
 * Por qué, si el resto de la app sí la usa: un rompehielos no tiene captura
 * ni contexto que analizar. El modelo recibe siempre la misma petición y
 * devuelve variaciones de lo mismo, así que se estaba pagando por generar
 * algo que se puede escribir una vez y servir infinitas veces. Sirviéndolos
 * desde aquí, la función es gratis de verdad —no gasta ninguno de los 5
 * créditos— y responde al instante en vez de tardar tres segundos.
 *
 * Los cuatro tonos premium de Rompehielos SÍ pasan por la IA: ahí es donde
 * está la diferencia por la que alguien paga.
 *
 * Viven en el backend y no en la app a propósito, por la misma razón que el
 * catálogo: se pueden corregir, quitar o ampliar sin publicar una versión
 * nueva en las tiendas.
 *
 * CRITERIO PARA AÑADIR UNO NUEVO:
 * 1. Tiene que ser fácil de responder. Si la otra persona no sabe qué
 *    contestar, el rompehielos falló, por gracioso que sea.
 * 2. No puede depender de datos que no tenemos: ni nombre, ni ciudad, ni de
 *    dónde se conocen.
 * 3. Nada que sirva para cualquiera ("hola linda", "vi tu perfil").
 * 4. Que suene a persona: frases cortas, minúscula inicial, sin signos de
 *    apertura si no hacen falta.
 */

export const ROMPEHIELOS: readonly string[] = [
  // ── Dilemas: se responden solos porque obligan a elegir ────────────────
  'pregunta seria y sin miedo: ¿piña en la pizza, sí o no?',
  'necesito un desempate: ¿el pan con chicharrón es desayuno o almuerzo?',
  'dime algo, ¿eres de los que dejan en visto o de los que responden a los tres días?',
  'elige: nunca más ceviche o nunca más pollo a la brasa',
  '¿playa o montaña? y ojo que tu respuesta dice mucho de ti',
  'debate del día: ¿el chifa es comida peruana o comida china?',
  'una cosa importante antes de seguir: ¿café o té?',
  '¿eres team levantarse temprano o team dormir hasta tarde? necesito saber con quién trato',
  'define: ¿la mejor pizza es la que tiene mucho queso o la que tiene poco pero bueno?',
  '¿qué es peor, que te dejen en visto o que te respondan "ok"?',

  // ── Confesiones que invitan a otra confesión ───────────────────────────
  'confesión random: acabo de descubrir que llevaba años diciendo mal una palabra. ¿te ha pasado?',
  'tengo una teoría rara y necesito alguien con quien discutirla, ¿te animas?',
  'dato inútil sobre mí: puedo comer lo mismo cinco días seguidos sin aburrirme. tu turno',
  'admito sin vergüenza que tengo una playlist para lavar los platos. ¿tú tienes alguna secreta?',
  'llevo veinte minutos decidiendo qué escribirte, así que esto es lo que hay. ¿qué tal tu día?',
  'estoy en esa etapa de la noche en la que uno se pone a pensar cosas raras. ¿te pasa?',
  'me acabo de dar cuenta de que no sé hacer nada útil con las manos. ¿tú sabes algo?',
  'mi último descubrimiento: hay gente que le pone azúcar al arroz. sigo en shock',

  // ── Juegos: traen la respuesta incorporada ─────────────────────────────
  'dos verdades y una mentira, va: sé silbar, odio el helado, me he perdido en mi propio barrio. ¿cuál es?',
  'juguemos a algo fácil: dime tres cosas que harías si mañana no tuvieras que trabajar',
  'te doy tres opciones para el fin de semana y eliges: comida rica, película, o salir a caminar sin rumbo',
  'ronda rápida: una serie que recomiendes sin pensarlo',
  'si tuvieras que quedarte con una sola comida el resto de tu vida, ¿cuál sería?',
  'test rápido: ¿qué canción tienes en repeat últimamente?',
  'cuéntame un plan que siempre quisiste hacer y nunca hiciste. tal vez te acompaño',
  'dime tu opinión más polémica sobre comida, prometo no juzgar. mucho',

  // ── Observaciones y aperturas honestas ─────────────────────────────────
  'oye, pregunta rápida: ¿qué cosa te ha tenido de buen humor estos días?',
  'me da curiosidad qué haces cuando no estás haciendo nada. ¿en qué se te va el tiempo?',
  'sin ser intenso: ¿qué es lo mejor que te ha pasado esta semana?',
  '¿qué cosa te da flojera hacer pero igual haces?',
  'necesito ideas: ¿qué se hace un domingo cuando no quieres salir pero tampoco quedarte?',
  'dime algo que te haga reír aunque a nadie más le dé gracia',
  '¿eres de planear todo o de improvisar sobre la marcha?',
  'si pudieras aprender algo de un día para otro, sin esfuerzo, ¿qué sería?',
  'qué opinas: ¿la gente cambia o solo se le nota más lo que ya era?',
  'me quedé pensando en algo random: ¿cuál fue la última vez que te sorprendiste de verdad?',

  // ── Directos, con seguridad y sin presión ──────────────────────────────
  'te escribo sin excusa ni pretexto, que es más honesto. ¿cómo va todo?',
  'voy a ser directo: me dio curiosidad conocerte. ¿qué tal si empezamos por algo fácil, cómo estuvo tu día?',
  'no tengo una frase ingeniosa preparada, así que te pregunto de frente: ¿qué te gusta hacer?',
  'igual esto queda en nada, pero me arriesgo: ¿te tomarías un café en algún momento?',
  'sin rodeos: me caes bien desde antes de hablarte. a ver si no me equivoco',
  'aviso: escribo primero y pienso después. así que hola, ¿qué cuentas?',

  // ── Con humor propio, sin depender de la otra persona ──────────────────
  'iba a escribirte algo ingenioso pero se me fue la idea a mitad de camino. te queda esto',
  'estuve a punto de mandarte un "hola" a secas, así que ya vas ganando',
  'si esto sale mal, te juro que yo también me voy a reír',
  'me dijeron que empezar con un chiste era buena idea, así que ahí va: nada, no tengo. ¿tú sabes alguno?',
  'considera esto mi mejor intento de sonar interesante. el listón está bajo, pero está',
  'llegué hasta aquí sin saber qué escribir y ya no puedo dar marcha atrás. ayúdame tú',
  'no soy bueno para empezar conversaciones pero soy muy bueno para continuarlas. dame una oportunidad',
  'esto es lo más creativo que se me ocurrió en diez minutos. sé amable',
];

/**
 * Devuelve un rompehielos distinto al anterior.
 *
 * El `anterior` se pasa cuando el usuario toca "Generar otra respuesta". Sin
 * eso, el azar puede repetir el mismo dos veces seguidas, que es justo lo
 * que hace pensar que la app está rota.
 */
export function elegirRompehielos(anterior?: string): string {
  const candidatos = anterior
    ? ROMPEHIELOS.filter((frase) => frase !== anterior)
    : ROMPEHIELOS;

  const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];

  // `candidatos` nunca está vacío —el banco tiene 50 y solo se excluye uno—,
  // pero el tipo no lo sabe.
  return elegido ?? ROMPEHIELOS[0]!;
}
