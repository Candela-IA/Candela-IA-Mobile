/**
 * Crea la base de datos vacía si no existe.
 *
 * ¿Por qué un script aparte y no Prisma?
 * Prisma crea TABLAS, no BASES DE DATOS. Y con razón: el usuario de la
 * aplicación no debería tener permiso para crear ni borrar bases — si algún
 * día se compromete la app, ese permiso sería el peor de los regalos.
 *
 * Este script se conecta con credenciales de administrador SOLO para crear
 * el contenedor vacío. Después Prisma trabaja con el usuario normal.
 *
 * En producción (Railway, PlanetScale, RDS) esto no se usa: la plataforma
 * provisiona la base y te entrega el DATABASE_URL ya listo.
 *
 *   npm run db:setup
 */

import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

config();

const COLLATION = 'utf8mb4_unicode_ci';
const CHARSET = 'utf8mb4';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;

  if (!url) {
    fallar(
      'No encontré DATABASE_URL.',
      'Copia .env.example a .env y rellena tus datos de MySQL.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url!);
  } catch {
    fallar(
      'DATABASE_URL tiene un formato inválido.',
      'Debe verse así: mysql://usuario:password@localhost:3306/candela_ia',
    );
    return;
  }

  const nombreBd = parsed.pathname.replace(/^\//, '');

  if (!nombreBd) {
    fallar(
      'DATABASE_URL no incluye el nombre de la base.',
      'Debe terminar en /candela_ia',
    );
  }

  // Nos conectamos al servidor SIN especificar base — todavía no existe.
  const conexion = await createConnection({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  }).catch((e: Error) => {
    fallar(
      `No pude conectarme a MySQL en ${parsed.hostname}:${parsed.port || 3306}`,
      'Verifica que el servicio de MySQL esté corriendo y que el usuario y ' +
        'la contraseña del .env sean correctos.',
      e.message,
    );
    throw e;
  });

  try {
    // El nombre viene de tu propio .env, no de una petición web. Aun así lo
    // validamos: MySQL no admite el nombre de base como parámetro preparado,
    // así que la única defensa posible es restringir los caracteres.
    if (!/^[a-zA-Z0-9_]+$/.test(nombreBd)) {
      fallar(
        `Nombre de base inválido: "${nombreBd}"`,
        'Usa solo letras, números y guiones bajos.',
      );
    }

    const [filas] = await conexion.query<any[]>(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [nombreBd],
    );
    const yaExistia = filas.length > 0;

    await conexion.query(
      `CREATE DATABASE IF NOT EXISTS \`${nombreBd}\` ` +
        `CHARACTER SET ${CHARSET} COLLATE ${COLLATION}`,
    );

    if (yaExistia) {
      console.log(`\n✔  La base "${nombreBd}" ya existía. Nada que hacer.\n`);
    } else {
      console.log(`\n✔  Base "${nombreBd}" creada (${CHARSET} / ${COLLATION}).`);
      console.log('   utf8mb4 es obligatorio: sin él los emojis se rompen,');
      console.log('   y esta app está llena de ellos. 🔥\n');
    }

    console.log('   Siguiente paso:  npx prisma migrate dev --name inicial\n');
  } finally {
    await conexion.end();
  }
}

function fallar(titulo: string, ayuda: string, detalle?: string): never {
  console.error(`\n❌ ${titulo}`);
  console.error(`   ${ayuda}`);
  if (detalle) console.error(`\n   Detalle: ${detalle}`);
  console.error('');
  process.exit(1);
}

main().catch((e: Error) => {
  console.error('\n❌ Error inesperado:', e.message, '\n');
  process.exit(1);
});
