/**
 * BANCO DE PRUEBAS DE PROMPTS
 *
 * Dispara un lote de generaciones reales contra la API y las imprime juntas
 * para poder leerlas de corrido y responder la única pregunta que importa:
 * ¿mandarías tú ese mensaje?
 *
 * Hacer esto desde el celular obliga a tocar veinte veces la pantalla por
 * cada caso, y comparar tonos es imposible porque solo ves uno a la vez.
 * Aquí salen todos seguidos, con su costo y su latencia.
 *
 *   npx ts-node scripts/probar-prompts.ts
 *   npx ts-node scripts/probar-prompts.ts --funcion ROMPEHIELOS
 *   npx ts-node scripts/probar-prompts.ts --capturas ./capturas
 *
 * La carpeta de capturas se organiza así (.jpg .jpeg .png .webp):
 *
 *   capturas/chat/     → se prueban con ANALIZAR_CHAT
 *   capturas/stories/  → se prueban con ANALIZAR_STORIES
 *
 * REQUISITOS: el backend corriendo (`npm run dev`) y, para que esto sirva
 * de algo, AI_PROVIDER="openai" en el .env. Con "mock" solo verás las
 * frases enlatadas de siempre.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const BASE = process.env.API_URL ?? 'http://localhost:3000/api/v1';

/**
 * `POST /generar` está limitado a 3 peticiones cada 10 segundos por IP.
 * Sin esta pausa el lote se comería sus propios 429 a partir del cuarto
 * caso. 3.6s deja margen para el redondeo de la ventana.
 */
const PAUSA_MS = 3_600;

/** Dispositivo de pruebas: nombre reconocible para poder borrarlo a mano. */
const DEVICE_KEY = 'script-banco-de-pruebas';

// ─────────────────────────────────────────────────────────────────────────
// CASOS
//
// No son ejemplos bonitos: son las situaciones donde un prompt mediocre se
// delata. Sin datos, con contexto, con límite de caracteres, tonos premium
// que tienen que notarse mejores que los gratis.
// ─────────────────────────────────────────────────────────────────────────

type Funcion =
  | 'ROMPEHIELOS'
  | 'CREAR_NOTAS'
  | 'ANALIZAR_CHAT'
  | 'ANALIZAR_STORIES';

interface Caso {
  funcion: Funcion;
  tono: string;
  contexto?: string;
  /** Qué se está poniendo a prueba. Se imprime junto al resultado. */
  prueba: string;
}

const CASOS_SIN_IMAGEN: Caso[] = [
  {
    funcion: 'ROMPEHIELOS',
    tono: 'basico',
    prueba: 'Sin ningún dato. ¿Evita el "hola, ¿cómo estás?"?',
  },
  {
    funcion: 'ROMPEHIELOS',
    tono: 'divertido',
    prueba: '¿Da risa de verdad o es humor de tarjeta de felicitación?',
  },
  {
    funcion: 'ROMPEHIELOS',
    tono: 'misterioso',
    prueba: '¿Intriga, o solo suena raro?',
  },
  {
    funcion: 'ROMPEHIELOS',
    tono: 'directo',
    prueba: '¿Directo sin cruzar a incómodo?',
  },
  {
    funcion: 'ROMPEHIELOS',
    tono: 'romantico',
    prueba: '¿Romántico sin ser cursi con una desconocida?',
  },
  {
    funcion: 'CREAR_NOTAS',
    tono: 'divertidas',
    prueba: '¿Respeta los 60 caracteres sin quedar cortada?',
  },
  {
    funcion: 'CREAR_NOTAS',
    tono: 'indirectas',
    contexto: 'Quiero que la vea alguien con quien dejé de hablar hace poco.',
    prueba: '¿Usa el contexto sin nombrar a nadie?',
  },
  {
    funcion: 'CREAR_NOTAS',
    tono: 'atrevidas',
    prueba: '¿Atrevida sin pasarse a vulgar?',
  },
  {
    funcion: 'CREAR_NOTAS',
    tono: 'mas_impacto',
    prueba: 'Tono premium: ¿se nota mejor que el gratis?',
  },
  {
    funcion: 'CREAR_NOTAS',
    tono: 'hacer_pensar',
    prueba: 'Tono premium: ¿es profundo o una galletita de la fortuna?',
  },
];

/** Los casos con captura salen de las imágenes que haya en la carpeta. */
const TONOS_CHAT = ['ligar', 'divertida', 'seguro', 'salvar_situacion'];
const TONOS_STORIES = ['divertido', 'atrevido', 'seguro'];

interface CasoPreparado {
  caso: Caso;
  captura?: string;
  imagen?: { base64: string; mimeType: string };
}

interface Resultado {
  caso: Caso;
  captura?: string;
  mensaje: string;
  ms: number;
}

// ─────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const filtro = leerOpcion(args, '--funcion');
  const carpetaCapturas = leerOpcion(args, '--capturas');

  await verificarApiViva();
  avisarSiEsMock();

  const casos = armarCasos(filtro, carpetaCapturas);

  if (casos.length === 0) {
    console.log('\nNingún caso que ejecutar. Revisa --funcion o --capturas.');
    return;
  }

  const token = await prepararDispositivo();

  const minutos = Math.ceil((casos.length * (PAUSA_MS + 4000)) / 60000);
  console.log(
    `\n${casos.length} generaciones. Tarda unos ${minutos} minutos por el ` +
      'límite de peticiones del servidor.\n',
  );

  const resultados: Resultado[] = [];
  const fallos: string[] = [];

  for (const [indice, preparado] of casos.entries()) {
    const { caso, captura, imagen } = preparado;

    process.stdout.write(
      `[${indice + 1}/${casos.length}] ${caso.funcion} · ${caso.tono}… `,
    );

    const inicio = Date.now();

    try {
      const mensaje = await generar(token, caso, imagen);
      resultados.push({ caso, captura, mensaje, ms: Date.now() - inicio });
      console.log('ok');
    } catch (e) {
      const detalle = e instanceof Error ? e.message : String(e);
      fallos.push(`${caso.funcion}/${caso.tono}: ${detalle}`);
      console.log(`FALLÓ — ${detalle}`);
    }

    if (indice < casos.length - 1) await dormir(PAUSA_MS);
  }

  imprimirResultados(resultados);
  await imprimirResumen(fallos);
}

// ─────────────────────────────────────────────────────────────────────────
// Preparación
// ─────────────────────────────────────────────────────────────────────────

async function verificarApiViva(): Promise<void> {
  try {
    const r = await fetch(`${BASE}/catalogo`);
    if (!r.ok) throw new Error(`respondió ${r.status}`);
  } catch (e) {
    console.error(
      `\nNo pude hablar con la API en ${BASE}\n` +
        `  ${e instanceof Error ? e.message : String(e)}\n\n` +
        '¿Está corriendo el backend? → npm run dev\n',
    );
    process.exit(1);
  }
}

function avisarSiEsMock(): void {
  if (process.env.AI_PROVIDER !== 'mock') return;

  console.warn(
    '\n  AVISO: AI_PROVIDER está en "mock".\n' +
      '  Vas a ver frases escritas a mano, no respuestas del modelo, así\n' +
      '  que esta corrida no sirve para juzgar la calidad de los prompts.\n' +
      '  Pon AI_PROVIDER="openai" en el .env y reinicia el backend.\n',
  );
}

/**
 * Registra el dispositivo de pruebas y le da suscripción activa.
 *
 * Sin esto el lote se quedaría sin créditos en la quinta generación, y los
 * tonos premium —que son justo los que hay que validar, porque son los que
 * se cobran— responderían 402.
 */
async function prepararDispositivo(): Promise<string> {
  const respuesta = await fetch(`${BASE}/dispositivos/registrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceKey: DEVICE_KEY, plataforma: 'ANDROID' }),
  });

  if (!respuesta.ok) {
    throw new Error(
      `No pude registrar el dispositivo de pruebas: ${respuesta.status} ` +
        (await respuesta.text()),
    );
  }

  const { token } = (await respuesta.json()) as { token: string };

  const prisma = new PrismaClient();

  try {
    const device = await prisma.device.findUniqueOrThrow({
      where: { deviceKey: DEVICE_KEY },
      select: { id: true },
    });

    const enUnAnio = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await prisma.subscription.upsert({
      where: { deviceId: device.id },
      create: {
        deviceId: device.id,
        status: 'ACTIVE',
        plan: 'ANNUAL',
        expiresAt: enUnAnio,
      },
      update: { status: 'ACTIVE', plan: 'ANNUAL', expiresAt: enUnAnio },
    });

    // El contador diario a cero, para poder correr el banco varias veces el
    // mismo día sin chocar con el tope de uso justo.
    await prisma.creditBalance.updateMany({
      where: { deviceId: device.id },
      data: { dailyUsed: 0 },
    });
  } finally {
    await prisma.$disconnect();
  }

  return token;
}

// ─────────────────────────────────────────────────────────────────────────
// Casos
// ─────────────────────────────────────────────────────────────────────────

function armarCasos(
  filtro: string | undefined,
  carpeta: string | undefined,
): CasoPreparado[] {
  const casos: CasoPreparado[] = CASOS_SIN_IMAGEN.map((caso) => ({ caso }));

  if (carpeta) {
    casos.push(
      ...cargarCapturas(join(carpeta, 'chat'), 'ANALIZAR_CHAT', TONOS_CHAT),
      ...cargarCapturas(
        join(carpeta, 'stories'),
        'ANALIZAR_STORIES',
        TONOS_STORIES,
      ),
    );
  } else {
    console.log(
      '\nSin --capturas se omiten Analizar chat y Analizar Stories.\n' +
        'Esas dos son las que más dependen de leer bien la imagen, así que\n' +
        'conviene probarlas antes de dar los prompts por buenos.',
    );
  }

  return filtro ? casos.filter((c) => c.caso.funcion === filtro) : casos;
}

const EXTENSIONES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function cargarCapturas(
  carpeta: string,
  funcion: Funcion,
  tonos: string[],
): CasoPreparado[] {
  let archivos: string[];

  try {
    archivos = readdirSync(carpeta).filter(
      (a) => EXTENSIONES[extname(a).toLowerCase()] !== undefined,
    );
  } catch {
    console.log(`  (no encontré la carpeta ${carpeta}, la omito)`);
    return [];
  }

  const preparados: CasoPreparado[] = [];

  for (const archivo of archivos) {
    const ruta = join(carpeta, archivo);
    const mimeType = EXTENSIONES[extname(archivo).toLowerCase()]!;
    const base64 = readFileSync(ruta).toString('base64');

    for (const tono of tonos) {
      preparados.push({
        caso: { funcion, tono, prueba: `¿Entendió qué pasa en ${archivo}?` },
        captura: archivo,
        imagen: { base64, mimeType },
      });
    }
  }

  return preparados;
}

// ─────────────────────────────────────────────────────────────────────────
// Ejecución
// ─────────────────────────────────────────────────────────────────────────

async function generar(
  token: string,
  caso: Caso,
  imagen?: { base64: string; mimeType: string },
): Promise<string> {
  const respuesta = await fetch(`${BASE}/generar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      funcion: caso.funcion,
      tono: caso.tono,
      contexto: caso.contexto,
      imagen,
    }),
  });

  const cuerpo = (await respuesta.json()) as {
    mensaje?: string;
    codigo?: string;
  };

  if (!respuesta.ok) {
    const detalle = `${respuesta.status} ${cuerpo.codigo ?? ''} ${
      cuerpo.mensaje ?? ''
    }`;
    throw new Error(detalle.trim());
  }

  return cuerpo.mensaje ?? '(vacío)';
}

// ─────────────────────────────────────────────────────────────────────────
// Salida
// ─────────────────────────────────────────────────────────────────────────

function imprimirResultados(resultados: Resultado[]): void {
  let funcionActual = '';

  for (const { caso, captura, mensaje, ms } of resultados) {
    if (caso.funcion !== funcionActual) {
      funcionActual = caso.funcion;
      console.log(`\n\n${'═'.repeat(72)}`);
      console.log(`  ${funcionActual}`);
      console.log('═'.repeat(72));
    }

    const largo = [...mensaje].length;
    const guiones = '─'.repeat(Math.max(4, 48 - caso.tono.length));

    console.log(`\n  ── ${caso.tono}${captura ? ` · ${captura}` : ''} ${guiones}`);
    console.log(`  prueba: ${caso.prueba}`);
    if (caso.contexto) console.log(`  contexto: "${caso.contexto}"`);
    console.log('');
    for (const linea of envolver(mensaje, 66)) console.log(`    ${linea}`);
    console.log(`\n  ${largo} caracteres · ${ms} ms`);
  }
}

async function imprimirResumen(fallos: string[]): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const device = await prisma.device.findUnique({
      where: { deviceKey: DEVICE_KEY },
      select: { id: true },
    });

    if (device) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const m = await prisma.generation.aggregate({
        where: { deviceId: device.id, createdAt: { gte: hoy } },
        _sum: { costUsd: true, tokensIn: true, tokensOut: true },
        _avg: { latencyMs: true },
        _count: true,
      });

      console.log(`\n\n${'═'.repeat(72)}`);
      console.log('  RESUMEN DE HOY');
      console.log('═'.repeat(72));
      console.log(`  Generaciones : ${m._count}`);
      console.log(`  Costo total  : $${Number(m._sum.costUsd ?? 0).toFixed(4)}`);
      console.log(
        `  Latencia     : ${Math.round(m._avg.latencyMs ?? 0)} ms de media`,
      );
      console.log(
        `  Tokens       : ${m._sum.tokensIn ?? 0} entrada · ` +
          `${m._sum.tokensOut ?? 0} salida`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }

  if (fallos.length > 0) {
    console.log(`\n  ${fallos.length} fallaron:`);
    for (const fallo of fallos) console.log(`    · ${fallo}`);
  }

  console.log(
    '\n  Ahora la parte que ninguna herramienta hace por ti: lee cada uno y\n' +
      '  pregúntate si lo mandarías. Los que no pasen ese filtro se arreglan\n' +
      '  en src/modules/generation/domain/prompt-builder.ts\n',
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────────────

function leerOpcion(args: string[], nombre: string): string | undefined {
  const indice = args.indexOf(nombre);
  return indice >= 0 ? args[indice + 1] : undefined;
}

function envolver(texto: string, ancho: number): string[] {
  const lineas: string[] = [];

  for (const parrafo of texto.split('\n')) {
    let actual = '';

    for (const palabra of parrafo.split(' ')) {
      if (actual && [...actual].length + [...palabra].length + 1 > ancho) {
        lineas.push(actual);
        actual = palabra;
      } else {
        actual = actual ? `${actual} ${palabra}` : palabra;
      }
    }

    lineas.push(actual);
  }

  return lineas;
}

function dormir(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

main().catch((e) => {
  console.error('\n', e);
  process.exit(1);
});
