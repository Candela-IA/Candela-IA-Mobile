/**
 * CATÁLOGO DE FUNCIONES Y TONOS
 *
 * Fuente única de verdad de qué puede hacer la app. La app móvil consulta
 * este catálogo por API en vez de tenerlo quemado en el código, así puedes
 * agregar tonos o mover uno a premium sin publicar una versión nueva.
 */

import { TonoInvalidoError } from '../../../shared/domain/domain-error';

export enum Funcion {
  ANALIZAR_CHAT = 'ANALIZAR_CHAT',
  ANALIZAR_STORIES = 'ANALIZAR_STORIES',
  ROMPEHIELOS = 'ROMPEHIELOS',
  CREAR_NOTAS = 'CREAR_NOTAS',
}

export enum Nivel {
  GRATIS = 'GRATIS',
  PREMIUM = 'PREMIUM',
}

/**
 * Color con el que la app pinta cada tono.
 *
 * Vive en el catálogo y no en la app por la misma razón que todo lo demás:
 * cambiar la paleta de un tono no debería obligar a publicar una versión
 * nueva en las tiendas.
 *
 * Los nombres son los seis acentos de la marca. Los premium van todos en
 * ÁMBAR a propósito: es el dorado de la corona, y que compartan color hace
 * que la fila de arriba se lea como un bloque distinto del resto.
 */
export enum ColorTono {
  ROSA = 'rosa',
  ROSE = 'rose',
  PURPURA = 'purpura',
  AZUL = 'azul',
  CIAN = 'cian',
  AMBAR = 'ambar',
}

export interface Tono {
  /** Identificador estable. Nunca cambia — la app lo manda tal cual. */
  readonly id: string;
  /** Lo que ve el usuario. */
  readonly etiqueta: string;
  readonly emoji: string;
  /** Subtítulo en la tarjeta. Opcional: no todas las pantallas lo muestran. */
  readonly descripcion?: string;
  readonly nivel: Nivel;
  /** Con qué acento de la marca lo pinta la app. */
  readonly color: ColorTono;
  /** Instrucción que se inyecta al prompt. El producto vive aquí. */
  readonly instruccion: string;
}

export interface DefinicionFuncion {
  readonly id: Funcion;
  readonly etiqueta: string;
  readonly requiereImagen: boolean;
  /** Acepta la nota de contexto opcional que escribe el usuario. */
  readonly aceptaContexto: boolean;
  /** Tope de caracteres de la salida. Las notas de IG son 60. */
  readonly maxCaracteres: number | null;
  readonly tonos: readonly Tono[];
}

// ─────────────────────────────────────────────────────────────────────────
// ANALIZAR CHAT
// ─────────────────────────────────────────────────────────────────────────

const TONOS_CHAT: readonly Tono[] = [
  {
    id: 'divertida',
    etiqueta: 'Divertida',
    emoji: '😄',
    nivel: Nivel.GRATIS,
    color: ColorTono.CIAN,
    instruccion: `QUÉ BUSCAS: que se ría de verdad, no que note que era un chiste. El humor sale de mirar lo que ELLA dijo desde un ángulo que no esperaba, nunca de un chiste traído de fuera.

CÓMO SUENA: ligero, rápido, sin explicarse. Si el chiste necesita una segunda frase para entenderse, no era el chiste.

NUNCA: juegos de palabras forzados, "jajaja" de relleno, humor a costa de ella, ni gracia genérica que valdría en cualquier conversación.

CALIBRA CON ESTO: le cuenta que se perdió yendo al gimnasio →
"O sea que el gimnasio te está evitando a ti. Respeto la estrategia."`,
  },
  {
    id: 'seguro',
    etiqueta: 'Seguro',
    emoji: '😎',
    nivel: Nivel.GRATIS,
    color: ColorTono.AZUL,
    instruccion: `QUÉ BUSCAS: que se note que no necesitas su aprobación para decir lo que piensas. Seguridad es decidir, no presumir.

CÓMO SUENA: corto y firme. Afirmas en vez de preguntar, propones en vez de consultar. Sin adornos y sin disculparte por escribir.

NUNCA: presumir, comparar, enumerar méritos, ni rematar con "¿te parece?" o "si quieres". Tampoco frialdad: seguro no es distante.

CALIBRA CON ESTO: te dice que no sabe si le dará tiempo el sábado →
"Entonces lo dejamos para el domingo, que tampoco corre prisa. ¿A qué hora te viene bien?"`,
  },
  {
    id: 'ingenioso',
    etiqueta: 'Ingenioso',
    emoji: '🧠',
    nivel: Nivel.GRATIS,
    color: ColorTono.PURPURA,
    instruccion: `QUÉ BUSCAS: que tenga que releerlo. Un giro en la lógica de lo que dijo: primero sorprende y después da risa, en ese orden.

CÓMO SUENA: preciso. Una idea, bien puesta. La gracia está en la construcción, no en la cantidad de palabras.

NUNCA: dártelas de listo, citar frases célebres, ni explicar el ingenio. Si hay que explicarlo, no lo era.

CALIBRA CON ESTO: te dice que es malísima mintiendo →
"Eso, o eres tan buena que ya me convenciste de lo contrario."`,
  },
  {
    id: 'romantico',
    etiqueta: 'Romántico',
    emoji: '❤️',
    nivel: Nivel.GRATIS,
    color: ColorTono.ROSE,
    instruccion: `QUÉ BUSCAS: que sienta que la estás mirando a ella y no a cualquiera. Ternura con puntería: un detalle concreto, dicho sin solemnidad.

CÓMO SUENA: cálido y tranquilo, con una sonrisa detrás. Bonito no es cursi; cursi es lo que se le podría decir a cualquier persona.

NUNCA: "princesa", "mi reina", corazones a puñados, poemas, ni declaraciones de amor a alguien con quien apenas has hablado.

CALIBRA CON ESTO: te cuenta que tuvo un día horrible →
"Ya está, se acabó el día. Cuéntame algo bueno que te haya pasado, aunque sea pequeño."`,
  },
  {
    id: 'ligar',
    etiqueta: 'Ligar',
    emoji: '😘',
    nivel: Nivel.GRATIS,
    color: ColorTono.ROSA,
    instruccion: `QUÉ BUSCAS: subir la temperatura sin anunciarlo. La atracción se insinúa; en cuanto se declara, se desactiva.

CÓMO SUENA: coqueto con calma, con media sonrisa. Lo que hace efecto es lo que NO dices.

NUNCA: piropos al físico, insinuaciones sexuales, ni cumplidos que suenen ensayados. Si parece una frase preparada, ya perdiste.

CALIBRA CON ESTO: te dice que se va a dormir →
"Vete, que mañana no hay quien te levante. Aunque te vas justo cuando esto se ponía bueno."`,
  },
  {
    id: 'dominante',
    etiqueta: 'Dominante',
    emoji: '👑',
    nivel: Nivel.GRATIS,
    color: ColorTono.PURPURA,
    instruccion: `QUÉ BUSCAS: que se note que sabes lo que quieres. Tomas la iniciativa y decides tú, sin pedir permiso para tener criterio.

CÓMO SUENA: directo, con la propuesta ya cerrada: dices el plan en vez de preguntar si le apetece pensar en uno.

NUNCA: ordenar, exigir, faltar al respeto ni presionar. Dominante es tener criterio, no imponerse — y si ella dice que no, se acepta a la primera y sin drama.

CALIBRA CON ESTO: lleváis tres mensajes sin decidir nada →
"Vale, decido yo: el viernes. El sitio lo eliges tú, que para algo tienes buen gusto."`,
  },
  {
    id: 'salvar_situacion',
    etiqueta: 'Salvar situación',
    emoji: '🆘',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: reabrir una conversación que se enfrió o se torció, sin señalar el silencio y sin sonar dolido.

CÓMO SUENA: ligero, con autoironía sobre TI, nunca sobre ella. Entras por un lado nuevo en vez de retomar justo donde se rompió.

NUNCA: reclamar el visto, disculparte de más, preguntar "¿pasa algo?" ni mandar dos mensajes seguidos. Y si ella dejó claro que no quiere seguir, no insistas: cierra con dignidad y deja la puerta entornada.

CALIBRA CON ESTO: te dejó en visto hace cuatro días →
"Ya cumplí mi condena por el último mensaje. ¿Lo intentamos otra vez?"`,
  },
  {
    id: 'dar_celos',
    etiqueta: 'Dar celos',
    emoji: '😈',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: que se note que tienes una vida que sigue con o sin ella. La curiosidad nace de lo que insinúas, no de lo que cuentas.

CÓMO SUENA: de pasada, sin darle importancia. Un plan tuyo mencionado al vuelo dice más que una historia contada entera.

NUNCA: inventar personas, fingir citas, mentir sobre dónde estuviste ni jugar a ponerla nerviosa. Eso no es intriga, es manipular — y cuando se descubre, se acabó.

CALIBRA CON ESTO: te pregunta qué harás el fin de semana →
"El sábado ya tengo plan y todavía no sé cuál. El domingo lo tengo libre, por si acaso."`,
  },
  {
    id: 'mantener_interes',
    etiqueta: 'Mantener interés',
    emoji: '🎯',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: que quiera responder ya. Dejas algo a medias: una puerta abierta, no un acertijo.

CÓMO SUENA: cercano, con una pregunta fácil o un tema a medio abrir. Menos información, más ganas.

NUNCA: ser críptico por deporte, dejarla sin saber qué contestar, ni preguntar por preguntar ("¿y tú qué tal?").

CALIBRA CON ESTO: la conversación va bien pero se está apagando →
"Me acordé de algo que dijiste el otro día y me dio risa solo. Luego te cuento, que ahora me da vergüenza."`,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// ANALIZAR STORIES
// ─────────────────────────────────────────────────────────────────────────

const TONOS_STORIES: readonly Tono[] = [
  {
    id: 'divertido',
    etiqueta: 'Divertido',
    emoji: '😄',
    descripcion: 'Con humor y chispa',
    nivel: Nivel.GRATIS,
    color: ColorTono.CIAN,
    instruccion: `QUÉ BUSCAS: que se ría de algo que se ve en SU historia. Sin la historia delante, tu mensaje no debería tener ningún sentido.

CÓMO SUENA: espontáneo, como quien reacciona en voz alta. Una línea, sin preparar.

NUNCA: "qué linda foto", emojis a secas, ni un chiste que valdría para la historia de cualquier otra persona.

CALIBRA CON ESTO: sube un desayuno con comida para tres →
"Eso no es un desayuno, es una despedida. ¿Vas a poder con todo?"`,
  },
  {
    id: 'romantico',
    etiqueta: 'Romántico',
    emoji: '❤️',
    descripcion: 'Tierno y coqueto',
    nivel: Nivel.GRATIS,
    color: ColorTono.ROSA,
    instruccion: `QUÉ BUSCAS: que note que te fijaste en ella y no en la foto. Coqueteo suave anclado en algo concreto de la historia.

CÓMO SUENA: cálido y breve, con una pregunta que le dé pie a contarte más.

NUNCA: piropos al cuerpo, "diosa", "perfección", ni frases que podrías copiar y pegar en otra historia sin cambiar una coma.

CALIBRA CON ESTO: sube el atardecer desde su ventana →
"Qué manera de cerrar el día. ¿Es la vista de siempre o hoy se lució?"`,
  },
  {
    id: 'seguro',
    etiqueta: 'Seguro',
    emoji: '😎',
    descripcion: 'Confiado y atractivo',
    nivel: Nivel.GRATIS,
    color: ColorTono.AZUL,
    instruccion: `QUÉ BUSCAS: comentar como quien no necesita que le contesten. Interés tranquilo, sin ansiedad.

CÓMO SUENA: corto, afirmativo, con criterio propio. Opinas de lo que ves en vez de halagarlo.

NUNCA: pedir aprobación, exagerar el entusiasmo, ni gastar tres líneas para decir que te gustó.

CALIBRA CON ESTO: sube lo que está escuchando →
"Buena elección. Tienes mejor oído del que aparentas."`,
  },
  {
    id: 'atrevido',
    etiqueta: 'Atrevido',
    emoji: '🔥',
    descripcion: 'Audaz y provocador',
    nivel: Nivel.GRATIS,
    color: ColorTono.PURPURA,
    instruccion: `QUÉ BUSCAS: decir lo que otros se callan, con picardía y sin cruzar la raya.

CÓMO SUENA: descarado con gracia y seguro de sí. Se atreve, pero deja escapatoria: ella tiene que poder seguirte el juego o cambiar de tema sin incomodarse.

NUNCA: nada sexual explícito, ningún comentario sobre su cuerpo, ni insistir si ella no sigue el juego.

CALIBRA CON ESTO: sube una foto arreglada para salir →
"Todo ese esfuerzo y encima lo subes aquí. Alguien va a tener la noche complicada."`,
  },
  {
    id: 'dar_celos',
    etiqueta: 'Dar celos',
    emoji: '😈',
    descripcion: 'Haz que te eche de menos',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: responder a su historia dejando ver, de pasada, que tu noche también tiene plan.

CÓMO SUENA: comentas lo suyo primero y en serio, no de trámite, y sueltas lo tuyo sin darle importancia.

NUNCA: inventar con quién estás, exagerar tu plan, ni convertirlo en competencia. Una vida propia se insinúa; demostrarla es justo lo que delata que no la hay.

CALIBRA CON ESTO: sube que salió a cenar →
"Buena pinta eso. Yo llevo una noche igual de improvisada y me está saliendo bien."`,
  },
  {
    id: 'mantener_interes',
    etiqueta: 'Mantener interés',
    emoji: '🎯',
    descripcion: 'Respuestas que enganchan',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: convertir la historia en conversación. El objetivo no es responder bien: es que ella conteste.

CÓMO SUENA: una pregunta concreta sobre lo que se ve, de las que dan ganas de contestar porque ella sabe la respuesta y tú no.

NUNCA: preguntas de sí o no, ni comentarios que se agoten solos ("qué bonito").

CALIBRA CON ESTO: sube un sitio que no reconoces →
"Espera, ¿eso dónde es? Llevo un rato intentando adivinarlo y me rindo."`,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// ROMPEHIELOS — sin imagen
//
// Modelo distinto al resto: el usuario gratis recibe un rompehielos
// "Básico" sin elegir nada, y los cuatro tonos con personalidad son el
// incentivo para suscribirse. Por eso `basico` es el único gratis y va
// primero: la app preselecciona el primer tono gratis de la lista.
// ─────────────────────────────────────────────────────────────────────────

const TONOS_ROMPEHIELOS: readonly Tono[] = [
  {
    id: 'basico',
    etiqueta: 'Básico',
    emoji: '✨',
    nivel: Nivel.GRATIS,
    color: ColorTono.ROSA,
    /**
     * El único `instruccion` que el modelo NUNCA lee: este tono se sirve del
     * banco de frases (`domain/rompehielos.ts`) sin llamar a la IA. Se queda
     * escrito por si algún día deja de servirse del banco, y corto a
     * propósito para que nadie lo mantenga creyendo que hace algo.
     */
    instruccion:
      'Un primer mensaje correcto y agradable, fácil de responder. Sin una ' +
      'personalidad marcada: amable y natural, sin arriesgar.',
  },
  {
    id: 'divertido',
    etiqueta: 'Divertido',
    emoji: '😄',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: que conteste porque le hizo gracia, no por educación. Un primer mensaje que da risa antes de saber quién lo manda.

CÓMO SUENA: absurdo controlado, con una pregunta detrás para que tenga algo concreto que responder.

NUNCA: chistes de manual, "hola guapa", ni gracia que dependa de conocerla — no la conoces de nada.

CALIBRA CON ESTO:
"Vengo con la pregunta más importante del día: ¿la pizza fría del día siguiente está buena o la comemos solo por orgullo?"`,
  },
  {
    id: 'misterioso',
    etiqueta: 'Misterioso',
    emoji: '🌙',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: que se quede con la duda, y que la única forma de resolverla sea contestarte.

CÓMO SUENA: dices menos de lo que sugieres. Una frase que deja claro que hay algo detrás — y lo hay.

NUNCA: sonar raro, hacerte el interesante sin nada debajo, ni plantear acertijos que den pereza. El misterio invita; el que cansa, espanta.

CALIBRA CON ESTO:
"Iba a escribirte algo normal y me arrepentí a mitad. Empecemos por lo raro: ¿qué fue lo último que te sorprendió de verdad?"`,
  },
  {
    id: 'directo',
    etiqueta: 'Directo',
    emoji: '⚡',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: decir a qué vienes, sin rodeos y sin disculparte por hacerlo.

CÓMO SUENA: claro y corto. Dices que te interesa conocerla y le das algo fácil por donde empezar.

NUNCA: pedir perdón por escribir, adornar la intención hasta que no se entienda, ni exigirle nada. Directo es honesto, no invasivo.

CALIBRA CON ESTO:
"Te escribo sin excusa: me dio curiosidad conocerte. Empecemos por lo fácil, ¿qué te alegró el día?"`,
  },
  {
    id: 'romantico',
    etiqueta: 'Romántico',
    emoji: '❤️',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: caer bien de entrada, con calidez y sin intensidad. Es el primer mensaje: todavía no hay nada que declarar.

CÓMO SUENA: amable y con encanto, como quien sonríe mientras escribe. Una pregunta que dé gusto contestar.

NUNCA: piropos, "eres preciosa", corazones ni cursilerías con una desconocida. Con alguien que no te conoce, eso aleja en vez de acercar.

CALIBRA CON ESTO:
"Voy a apostar a que respondes mejor de noche que de día. ¿Acierto o me equivoqué de persona?"`,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// CREAR NOTAS — sin imagen, máximo 60 caracteres (límite de Instagram)
// ─────────────────────────────────────────────────────────────────────────

const TONOS_NOTAS: readonly Tono[] = [
  {
    id: 'divertidas',
    etiqueta: 'Divertidas',
    emoji: '😄',
    descripcion: 'Con humor y chispa',
    nivel: Nivel.GRATIS,
    color: ColorTono.CIAN,
    instruccion: `QUÉ BUSCAS: que quien la lea sonría y le entren ganas de escribirte por eso mismo.

CÓMO SUENA: una frase suelta, absurda o exagerada, de las que se leen en dos segundos.

NUNCA: chistes largos, indirectas a alguien concreto, ni empezar como empezó tu nota anterior.

CALIBRA CON ESTO:
"Busco a alguien que me explique por qué existe el lunes."`,
  },
  {
    id: 'romanticas',
    etiqueta: 'Románticas',
    emoji: '❤️',
    descripcion: 'Tiernas y coquetas',
    nivel: Nivel.GRATIS,
    color: ColorTono.ROSA,
    instruccion: `QUÉ BUSCAS: que alguien sienta que esa nota podría ir por él, y se anime a comprobarlo.

CÓMO SUENA: cálida y ligera, bonita sin azúcar de más. Se insinúa, no se declara.

NUNCA: frases de taza, corazones en fila, ni sonar a que estás esperando a una persona concreta que no llega.

CALIBRA CON ESTO:
"Acepto recomendaciones de canciones y de personas."`,
  },
  {
    id: 'atrevidas',
    etiqueta: 'Atrevidas',
    emoji: '🔥',
    descripcion: 'Audaces y directas',
    nivel: Nivel.GRATIS,
    color: ColorTono.PURPURA,
    instruccion: `QUÉ BUSCAS: que se atreva a escribirte quien no lo haría con una nota normal.

CÓMO SUENA: descarada, con seguridad, y con un guiño que deja claro que es un juego.

NUNCA: nada sexual, nada vulgar, ni retos que incomoden a quien los lea.

CALIBRA CON ESTO:
"Escríbeme y te digo qué pensé de ti la primera vez."`,
  },
  {
    id: 'indirectas',
    etiqueta: 'Indirectas',
    emoji: '😏',
    descripcion: 'Sutiles e inteligentes',
    nivel: Nivel.GRATIS,
    color: ColorTono.AZUL,
    instruccion: `QUÉ BUSCAS: que una persona concreta se dé por aludida sin que nadie más lo note.

CÓMO SUENA: sutil, con doble lectura. Quien tiene que entenderlo lo entiende; el resto lee otra cosa.

NUNCA: nombres, iniciales, detalles que la señalen, ni reproches disfrazados de nota.

CALIBRA CON ESTO:
"Hay quien lee esto y sabe perfectamente que va por él."`,
  },
  {
    id: 'mas_impacto',
    etiqueta: 'Más impacto',
    emoji: '💎',
    descripcion: 'Notas que llaman la atención',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: que se pare el scroll. Una frase que se lea entera aunque nadie tuviera intención de leerla.

CÓMO SUENA: corta, rotunda, citable. Cuanto menos explica, más pesa.

NUNCA: frases de superación, citas de otra gente, ni palabras grandes para no decir nada.

CALIBRA CON ESTO:
"No contesto rápido. Contesto bien."`,
  },
  {
    id: 'hacer_pensar',
    etiqueta: 'Hacer que piense',
    emoji: '💭',
    descripcion: 'Notas que generan curiosidad',
    nivel: Nivel.PREMIUM,
    color: ColorTono.AMBAR,
    instruccion: `QUÉ BUSCAS: dejar una pregunta dando vueltas en la cabeza de quien la lee.

CÓMO SUENA: una idea abierta, sin respuesta y sin moraleja. Se piensa sola.

NUNCA: filosofía de manual, preguntas retóricas huecas, ni frases que se explican a sí mismas.

CALIBRA CON ESTO:
"¿Y si la persona correcta llega en el peor momento?"`,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// REGISTRO
// ─────────────────────────────────────────────────────────────────────────

export const CATALOGO: Readonly<Record<Funcion, DefinicionFuncion>> = {
  [Funcion.ANALIZAR_CHAT]: {
    id: Funcion.ANALIZAR_CHAT,
    etiqueta: 'Analizar chat',
    requiereImagen: true,
    aceptaContexto: true,
    maxCaracteres: null,
    tonos: TONOS_CHAT,
  },
  [Funcion.ANALIZAR_STORIES]: {
    id: Funcion.ANALIZAR_STORIES,
    etiqueta: 'Analizar Stories',
    requiereImagen: true,
    aceptaContexto: false,
    maxCaracteres: null,
    tonos: TONOS_STORIES,
  },
  [Funcion.ROMPEHIELOS]: {
    id: Funcion.ROMPEHIELOS,
    etiqueta: 'Rompehielos',
    requiereImagen: false,
    /**
     * Sin campo de contexto, a diferencia de las otras tres.
     *
     * Es un primer mensaje a alguien con quien nunca se ha hablado: no hay
     * conversación que explicar. La promesa de la pantalla es "un
     * rompehielos al instante", y pedir que escriba algo antes la rompería.
     */
    aceptaContexto: false,
    maxCaracteres: null,
    tonos: TONOS_ROMPEHIELOS,
  },
  [Funcion.CREAR_NOTAS]: {
    id: Funcion.CREAR_NOTAS,
    etiqueta: 'Crear notas',
    requiereImagen: false,
    /**
     * Sin campo de contexto, igual que Rompehielos.
     *
     * Una nota no va dirigida a nadie: la lee todo el que sigue al usuario.
     * No hay conversación ni persona concreta que explicarle a la IA, así
     * que ese campo pedía información que no existe. Y como la pantalla
     * tampoco lleva captura, quitarlo la deja en lo esencial: eliges el
     * tono y generas.
     */
    aceptaContexto: false,
    /// Límite real de las notas de Instagram.
    maxCaracteres: 60,
    tonos: TONOS_NOTAS,
  },
} as const;

export function obtenerFuncion(funcion: Funcion): DefinicionFuncion {
  return CATALOGO[funcion];
}

export function obtenerTono(funcion: Funcion, tonoId: string): Tono {
  const definicion = CATALOGO[funcion];
  const tono = definicion.tonos.find((t) => t.id === tonoId);
  if (!tono) {
    throw new TonoInvalidoError(tonoId, definicion.etiqueta);
  }
  return tono;
}
