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
  'Pregunta seria y sin miedo: ¿piña en la pizza, sí o no?',
  'Necesito un desempate: ¿el pan con chicharrón es desayuno o almuerzo?',
  'Dime algo, ¿eres de los que dejan en visto o de los que responden a los tres días?',
  'Elige: nunca más ceviche o nunca más pollo a la brasa.',
  '¿Playa o montaña? Y ojo, que tu respuesta dice mucho de ti.',
  'Debate del día: ¿el chifa es comida peruana o comida china?',
  'Una cosa importante antes de seguir: ¿café o té?',
  '¿Eres de levantarse temprano o de dormir hasta tarde? Necesito saber con quién trato.',
  'Define: ¿la mejor pizza es la que tiene mucho queso o la que tiene poco pero bueno?',
  '¿Qué es peor, que te dejen en visto o que te respondan "ok"?',

  // ── Confesiones que invitan a otra confesión ───────────────────────────
  'Confesión al azar: acabo de descubrir que llevaba años diciendo mal una palabra. ¿Te ha pasado?',
  'Tengo una teoría rara y necesito a alguien con quien discutirla. ¿Te animas?',
  'Dato inútil sobre mí: puedo comer lo mismo cinco días seguidos sin aburrirme. Tu turno.',
  'Admito sin vergüenza que tengo una lista de canciones para lavar los platos. ¿Tú tienes alguna secreta?',
  'Llevo veinte minutos decidiendo qué escribirte, así que esto es lo que hay. ¿Qué tal tu día?',
  'Estoy en esa hora de la noche en la que uno se pone a pensar cosas raras. ¿Te pasa?',
  'Me acabo de dar cuenta de que no sé hacer nada útil con las manos. ¿Tú sabes algo?',
  'Mi último descubrimiento: hay gente que le pone azúcar al arroz. Sigo sin superarlo.',

  // ── Juegos: traen la respuesta incorporada ─────────────────────────────
  'Dos verdades y una mentira: sé silbar, odio el helado, me he perdido en mi propio barrio. ¿Cuál es?',
  'Juguemos a algo fácil: dime tres cosas que harías si mañana no tuvieras que trabajar.',
  'Te doy tres opciones para el fin de semana y eliges: comida rica, película, o salir a caminar sin rumbo.',
  'Ronda rápida: una serie que recomiendes sin pensarlo.',
  'Si tuvieras que quedarte con una sola comida el resto de tu vida, ¿cuál sería?',
  'Test rápido: ¿qué canción tienes en repetición últimamente?',
  'Cuéntame un plan que siempre quisiste hacer y nunca hiciste. Tal vez te acompaño.',
  'Dime tu opinión más polémica sobre comida. Prometo no juzgar. Mucho.',

  // ── Observaciones y aperturas honestas ─────────────────────────────────
  'Oye, pregunta rápida: ¿qué cosa te ha tenido de buen humor estos días?',
  'Me da curiosidad qué haces cuando no estás haciendo nada. ¿En qué se te va el tiempo?',
  'Sin ponerme intenso: ¿qué es lo mejor que te ha pasado esta semana?',
  '¿Qué cosa te da flojera hacer pero igual haces?',
  'Necesito ideas: ¿qué se hace un domingo cuando no quieres salir pero tampoco quedarte?',
  'Dime algo que te haga reír aunque a nadie más le dé gracia.',
  '¿Eres de planear todo o de improvisar sobre la marcha?',
  'Si pudieras aprender algo de un día para otro, sin esfuerzo, ¿qué sería?',
  'Qué opinas: ¿la gente cambia o solo se le nota más lo que ya era?',
  'Me quedé pensando en algo: ¿cuál fue la última vez que te sorprendiste de verdad?',

  // ── Directos, con seguridad y sin presión ──────────────────────────────
  'Te escribo sin excusa ni pretexto, que es más honesto. ¿Cómo va todo?',
  'Voy a ser directo: me dio curiosidad conocerte. ¿Empezamos por algo fácil? Cuéntame cómo estuvo tu día.',
  'No tengo una frase ingeniosa preparada, así que te pregunto de frente: ¿qué te gusta hacer?',
  'Igual esto queda en nada, pero me arriesgo. ¿Qué tal si empezamos por lo fácil?',
  'Sin rodeos: me caes bien desde antes de hablarte. A ver si no me equivoco.',
  'Aviso: escribo primero y pienso después. Así que hola, ¿qué cuentas?',

  // ── Con humor propio, sin depender de la otra persona ──────────────────
  'Iba a escribirte algo ingenioso, pero se me fue la idea a mitad de camino. Te queda esto.',
  'Estuve a punto de mandarte un "hola" a secas, así que ya vas ganando.',
  'Si esto sale mal, te juro que yo también me voy a reír.',
  'Me dijeron que empezar con un chiste era buena idea, así que ahí va: nada, no tengo. ¿Tú sabes alguno?',
  'Considera esto mi mejor intento de sonar interesante. El listón está bajo, pero está.',
  'Llegué hasta aquí sin saber qué escribir y ya no puedo dar marcha atrás. Ayúdame tú.',
  'No soy bueno para empezar conversaciones, pero sí para continuarlas. Dame una oportunidad.',
  'Esto es lo más creativo que se me ocurrió en diez minutos. Sé amable.',

  // ── Hipotéticos: obligan a imaginar, y eso engancha ────────────────────
  'Si mañana te dieran un día libre sin avisar, ¿qué harías con él?',
  'Te dan un pasaje a donde quieras, pero sales en dos horas. ¿A dónde vas?',
  'Si pudieras borrarte un recuerdo vergonzoso, ¿tienes uno en mente o son varios?',
  '¿Qué superpoder inútil te gustaría tener? Y sí, tiene que ser inútil.',
  'Si tu vida tuviera una canción de fondo ahora mismo, ¿cuál sonaría?',
  'Te toca elegir la última comida de tu vida y no puedes repetir. ¿Cuál?',
  'Si te dieran un año sabático pagado, ¿qué aprenderías?',
  '¿Qué tres cosas te llevarías a una isla? Y no vale decir un barco.',

  // ── Opiniones que piden réplica ────────────────────────────────────────
  'Opinión impopular: las series están mejor que las películas. Convénceme de lo contrario.',
  'Creo que la gente que responde audios de cinco minutos merece un juicio. ¿Exagero?',
  'El desayuno es la mejor comida del día y no acepto discusión. Bueno, sí la acepto.',
  'Sostengo que nadie ordena bien la ropa. Todos tenemos esa silla. ¿Me equivoco?',
  'Digo que el verano está sobrevalorado y me miran raro. ¿Tú de qué lado estás?',
  'Pienso que los lunes tienen mala fama inmerecida. ¿Me apoyas o me denuncias?',

  // ── Observaciones cotidianas, fáciles de continuar ─────────────────────
  'Llevo todo el día con una canción pegada y necesito pasársela a alguien. ¿Aceptas?',
  'Acabo de tomar la peor decisión gastronómica del mes. ¿Cuál fue la tuya?',
  'Estoy en esa fase de abrir la refri sabiendo que no hay nada nuevo. ¿Te suena?',
  'Hoy descubrí que llevaba la camiseta al revés desde la mañana. Cuéntame algo peor.',
  'Tengo veinte pestañas abiertas y ninguna es importante. ¿Cuántas llevas tú?',
  'Mi plan para hoy era ser productivo. Vamos perdiendo 3 a 0.',
  'Se me acaba de ir el santo al cielo a mitad de una frase. ¿Te pasa seguido?',

  // ── Micro-retos: no se pueden dejar sin responder ──────────────────────
  'Descríbete en tres palabras. Y no vale "no sé qué poner".',
  'Recomiéndame algo que te haya gustado esta semana. Lo que sea.',
  'Dime una cosa que hagas bien y que casi nadie sepa.',
  'Un lugar de la ciudad que todo el mundo debería conocer. Tienes un intento.',
  'Cuéntame el peor consejo que te hayan dado con toda la buena intención.',
  'Dame una razón para probar algo que odio. A ver si me convences.',
  'Elige: contarme un secreto tuyo o adivinar uno mío.',

  // ── Curiosidad genuina, sin sonar a entrevista ─────────────────────────
  '¿Qué es eso que podrías explicar durante una hora sin despeinarte?',
  '¿Qué cosa te parecía importantísima hace cinco años y hoy te da igual?',
  '¿Eres de guardar las cosas o de tirarlo todo cada tanto?',
  '¿Qué te hace perder la noción del tiempo?',
  '¿Cuál es tu forma favorita de perder una tarde?',
  '¿Qué es lo último que te dio ganas de contarle a alguien?',
  '¿Hay algo que todo el mundo disfruta y a ti no te dice nada?',
  '¿Qué cambiarías de tu rutina si nadie te juzgara por hacerlo?',

  // ── Con humor, sin depender de la otra persona ─────────────────────────
  'Vengo a subir el nivel de tu bandeja de entrada. Pongo lo que puedo.',
  'Escribí y borré esto cuatro veces. La quinta va sin revisar.',
  'Mi estrategia era esperar a que me escribieras tú. Fracasó.',
  'Tengo el récord de conversaciones que empiezo bien y termino raro. Ayúdame a romperlo.',
  'Aviso que mi sentido del humor es discutible. Tú dirás si sobrevive.',
  'Vengo con cero contexto y muchas ganas de conversar. ¿Empezamos?',
  'Si tuviera una frase brillante la usaría. Como no la tengo, va la honestidad.',
  'Prometo no preguntarte qué haces. Ya está, ese era mi mérito del día.',

  // ── Directos, con calma ────────────────────────────────────────────────
  'Podría dar mil vueltas, pero mejor pregunto directo: ¿cómo va tu semana?',
  'Me caía bien tu forma de escribir antes de hablarte. Vamos a ver si acierto.',
  'No sé si esto va a algún lado, pero me daba pena no intentarlo.',
  'Te escribo porque me dio curiosidad, sin más agenda que esa.',
  'Vengo sin plan, sin frase y sin vergüenza. Las tres cosas se arreglan hablando.',
  'Podría fingir que esto se me ocurrió solo, pero llevo un rato pensándolo.',
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
