/**
 * CONCEDER O QUITAR PREMIUM A UN DISPOSITIVO
 *
 * Sirve para dar acceso completo a una persona concreta —el cliente para
 * promocionar, alguien que probó y hay que compensar, un premio— sin repartir
 * una versión distinta de la app.
 *
 * POR QUÉ ASÍ Y NO CON UN APK ESPECIAL
 *
 * Un APK con premium activado se filtra: basta que quien lo tiene se lo pase
 * a un amigo o que alguien lo suba a una web de descargas, y a partir de ahí
 * cualquiera tiene acceso ilimitado — pagando el dueño de la cuenta de OpenAI
 * cada generación. Además serían dos binarios distintos, y el que se publica
 * dejaría de ser el que se probó.
 *
 * Marcando el dispositivo en la base de datos: un solo APK para todos, se
 * revoca cuando haga falta, y funciona en la app que la persona ya tiene
 * instalada, sin reinstalar nada.
 *
 *   npx ts-node scripts/conceder-premium.ts <deviceKey>
 *   npx ts-node scripts/conceder-premium.ts <deviceKey> --quitar
 *   npx ts-node scripts/conceder-premium.ts <deviceKey> --anios 2
 *
 * CONTRA LA BASE DE DATOS DE PRODUCCIÓN, que vive en la red privada de
 * Railway y no se alcanza desde fuera con la URL normal: hay que usar la
 * pública. En Railway → servicio MySQL → Variables → `MYSQL_PUBLIC_URL`.
 *
 *   DATABASE_URL="<MYSQL_PUBLIC_URL>" npx ts-node scripts/conceder-premium.ts <deviceKey>
 *
 * Esa URL lleva la contraseña dentro: se copia del panel a la terminal y no
 * se pega en ningún chat, ni se guarda en el repositorio.
 *
 * DÓNDE SACAR EL deviceKey: la persona lo tiene en la app, en
 * Ajustes → la tarjeta de abajo. Tocándolo se copia al portapapeles.
 *
 * OJO: no vale el ANDROID_ID que muestra cualquier app de "device info".
 * Desde Android 8 el sistema da un ANDROID_ID DISTINTO a cada aplicación,
 * derivado de su firma, así que el que enseña esa utilidad es el suyo y no
 * el de Candela.
 *
 * Si la persona todavía no tiene la versión que muestra el ID:
 *
 *   npx ts-node scripts/conceder-premium.ts --listar
 *
 * lista los últimos dispositivos por actividad. Se le pide que abra la app
 * en ese momento y el suyo aparece el primero.
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

/** Por defecto se concede por diez años, que a efectos prácticos es siempre. */
const ANIOS_POR_DEFECTO = 10;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const deviceKey = args.find((a) => !a.startsWith('--'));
  const quitar = args.includes('--quitar');
  const anios = Number(leerOpcion(args, '--anios') ?? ANIOS_POR_DEFECTO);

  if (args.includes('--listar')) {
    await listarDispositivos();
    return;
  }

  if (!deviceKey) {
    console.error(
      '\nFalta el identificador del dispositivo.\n\n' +
        '  npx ts-node scripts/conceder-premium.ts <deviceKey>\n' +
        '  npx ts-node scripts/conceder-premium.ts <deviceKey> --quitar\n\n' +
        'Lo tiene la persona en la app, en Ajustes, en la tarjeta de abajo.\n',
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const device = await prisma.device.findUnique({
      where: { deviceKey },
      select: { id: true, platform: true, createdAt: true },
    });

    if (!device) {
      console.error(
        `\nNo hay ningún dispositivo con la clave "${deviceKey}".\n\n` +
          'Tiene que haber abierto la app al menos una vez contra ESTE\n' +
          'backend: el registro ocurre en el primer arranque. Si la probó\n' +
          'apuntando a otro servidor, aquí no existe.\n',
      );
      process.exit(1);
    }

    if (quitar) {
      await prisma.subscription.updateMany({
        where: { deviceId: device.id },
        data: { status: 'EXPIRED', updatedAt: new Date() },
      });

      console.log(`\nPremium retirado a ${deviceKey}.`);
      console.log('Vuelve a sus 5 créditos gratis de siempre.\n');
      return;
    }

    const expira = new Date();
    expira.setFullYear(expira.getFullYear() + anios);

    await prisma.subscription.upsert({
      where: { deviceId: device.id },
      create: {
        deviceId: device.id,
        status: 'ACTIVE',
        plan: 'ANNUAL',
        expiresAt: expira,
      },
      update: { status: 'ACTIVE', plan: 'ANNUAL', expiresAt: expira },
    });

    // El contador diario a cero, por si venía de gastar sus créditos gratis.
    await prisma.creditBalance.updateMany({
      where: { deviceId: device.id },
      data: { dailyUsed: 0 },
    });

    console.log(`\nPremium concedido a ${deviceKey}`);
    console.log(`  Plataforma : ${device.platform}`);
    console.log(`  Registrado : ${device.createdAt.toLocaleDateString()}`);
    console.log(`  Vence      : ${expira.toLocaleDateString()}`);
    console.log(
      '\nTodos los tonos desbloqueados, sin gastar los 5 créditos gratis.\n' +
        'Sigue habiendo un tope de 50 generaciones al día, que es la regla\n' +
        'de uso justo de cualquier suscriptor — no un límite puesto a esta\n' +
        'persona.\n\n' +
        'Se aplica al instante: la app lee el saldo del servidor en cada\n' +
        'pantalla, así que basta con que vuelva a entrar.\n',
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Los últimos dispositivos que se registraron.
 *
 * Hace falta porque el identificador no se puede averiguar desde fuera: desde
 * Android 8 el ANDROID_ID es DISTINTO para cada app —lo deriva de la firma de
 * cada una—, así que el que muestra cualquier utilidad de "device info" no es
 * el que ve Candela. El único sitio donde aparece el bueno es dentro de la
 * propia app, en Ajustes.
 *
 * Mientras alguien no tenga esa versión instalada, se identifica por aquí: se
 * le pide que abra la app en un momento concreto y se mira cuál acaba de
 * registrarse.
 */
async function listarDispositivos(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const devices = await prisma.device.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: 15,
      select: {
        deviceKey: true,
        platform: true,
        appVersion: true,
        createdAt: true,
        lastSeenAt: true,
        subscription: { select: { status: true, expiresAt: true } },
        _count: { select: { generations: true } },
      },
    });

    if (devices.length === 0) {
      console.log('\nNo hay ningún dispositivo registrado todavía.\n');
      return;
    }

    console.log(`\nÚltimos ${devices.length} dispositivos, por actividad:\n`);

    for (const d of devices) {
      const premium = d.subscription?.status === 'ACTIVE' ? ' · PREMIUM' : '';
      console.log(`  ${d.deviceKey}${premium}`);
      console.log(
        `    ${d.platform} · v${d.appVersion ?? '?'} · ` +
          `${d._count.generations} generaciones · ` +
          `visto ${d.lastSeenAt.toLocaleString()}`,
      );
    }

    console.log(
      '\nPara saber cuál es el de alguien: que abra la app ahora mismo y\n' +
        'vuelve a correr esto. El suyo será el primero de la lista.\n',
    );
  } finally {
    await prisma.$disconnect();
  }
}

function leerOpcion(args: string[], nombre: string): string | undefined {
  const i = args.indexOf(nombre);
  return i >= 0 ? args[i + 1] : undefined;
}

void main();
