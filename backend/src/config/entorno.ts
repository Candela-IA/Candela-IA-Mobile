/**
 * VALIDACIÓN DEL ENTORNO
 *
 * Se ejecuta una sola vez, al arrancar, antes de que la aplicación escuche.
 * Si algo esencial falta o es un valor de ejemplo, el proceso muere aquí con
 * un mensaje que dice exactamente qué poner.
 *
 * Por qué al arrancar y no cuando haga falta: en Railway un arranque fallido
 * es un despliegue fallido — la versión anterior se queda sirviendo y nadie
 * se entera de nada. Un backend que arranca "a medias" y falla en la primera
 * generación, en cambio, se lleva por delante a los usuarios reales y el
 * error aparece disfrazado de otra cosa tres pantallas más adentro.
 *
 * Solo se valida lo que rompe el servicio entero. `REVENUECAT_WEBHOOK_SECRET`
 * no está aquí a propósito: mientras no exista la cuenta del cliente, el
 * webhook rechaza todo (`RevenueCatGuard`) y el resto de la app funciona
 * perfectamente. Exigirlo bloquearía el despliegue por algo que todavía no
 * depende de nosotros.
 */

/** Valores de ejemplo del `.env.example`. Que lleguen tal cual es un olvido. */
const PLACEHOLDERS = ['cambia_esto', 'sk-...', 'tu_password'];

/** Un secreto corto se puede probar por fuerza bruta; 32 es el mínimo sensato. */
const LARGO_MINIMO_SECRETO = 32;

export function validarEntorno(
  entorno: Record<string, unknown>,
): Record<string, unknown> {
  const fallos: string[] = [];
  const enProduccion = leer(entorno, 'NODE_ENV') === 'production';

  const baseDatos = leer(entorno, 'DATABASE_URL');
  if (!baseDatos) {
    fallos.push(
      'DATABASE_URL está vacía. En Railway se conecta al servicio de MySQL ' +
        'con una referencia: ${{ MySQL.MYSQL_URL }}',
    );
  } else if (!baseDatos.startsWith('mysql://')) {
    fallos.push(
      'DATABASE_URL no apunta a MySQL. Prisma está configurado con el ' +
        'proveedor mysql, así que la URL tiene que empezar por "mysql://".',
    );
  }

  const secreto = leer(entorno, 'JWT_SECRET');
  if (!secreto) {
    fallos.push(
      'JWT_SECRET está vacía. Genera una con:\n' +
        '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
    );
  } else if (esPlaceholder(secreto)) {
    fallos.push(
      'JWT_SECRET sigue siendo el valor de ejemplo del .env.example. ' +
        'Cualquiera que lea el repositorio podría firmar tokens válidos.',
    );
  } else if (secreto.length < LARGO_MINIMO_SECRETO) {
    fallos.push(
      `JWT_SECRET tiene ${secreto.length} caracteres; el mínimo es ${LARGO_MINIMO_SECRETO}.`,
    );
  }

  if (enProduccion) {
    if (leer(entorno, 'AI_PROVIDER') === 'mock') {
      fallos.push(
        'AI_PROVIDER="mock" en producción: la app serviría frases enlatadas ' +
          'a usuarios que están pagando. Quita la variable o ponla en "openai".',
      );
    } else {
      const clave = leer(entorno, 'OPENAI_API_KEY');
      if (!clave || esPlaceholder(clave)) {
        fallos.push(
          'OPENAI_API_KEY falta o es el valor de ejemplo. Sin ella, generar ' +
            'falla para todo el mundo.',
        );
      }
    }
  }

  if (fallos.length > 0) {
    throw new Error(
      `\n\nNo puedo arrancar: el entorno está incompleto.\n\n` +
        fallos.map((fallo) => `  • ${fallo}`).join('\n\n') +
        `\n\nEn local se arregla en backend/.env (copia de .env.example).\n` +
        `En Railway, en la pestaña Variables del servicio.\n`,
    );
  }

  return entorno;
}

function leer(entorno: Record<string, unknown>, clave: string): string {
  const valor = entorno[clave];
  return typeof valor === 'string' ? valor.trim() : '';
}

function esPlaceholder(valor: string): boolean {
  return PLACEHOLDERS.some((ejemplo) => valor.startsWith(ejemplo));
}
