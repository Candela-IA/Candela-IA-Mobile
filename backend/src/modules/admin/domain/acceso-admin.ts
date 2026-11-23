/**
 * ACCESO AL PANEL "ENTRENAR A LA IA"
 *
 * La app no tiene cuentas: cualquiera la instala y entra. El panel, en
 * cambio, cambia lo que responde la app a TODOS los usuarios, así que va
 * detrás de una contraseña que solo tiene el cliente.
 *
 * La contraseña vive en la variable `ADMIN_PASSWORD` de Railway, nunca en el
 * código ni en la app. Quien la escribe bien recibe un token de
 * administrador que dura unas horas.
 *
 * Funciones puras: se pueden probar sin NestJS.
 */

import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Por debajo de esto el panel se queda cerrado aunque la variable exista.
 * Una contraseña corta se adivina por fuerza bruta, y aquí lo que se juega
 * es lo que responde la app a todo el mundo.
 */
export const LARGO_MINIMO_CONTRASENA = 10;

/** Cuánto dura la sesión de administrador antes de volver a pedirla. */
export const DURACION_SESION_ADMIN = '12h';

/** El `rol` que llevan los tokens de administrador. */
export const ROL_ADMIN = 'admin';

/** ¿El servidor tiene una contraseña de panel utilizable? */
export function panelHabilitado(contrasena: string | undefined): boolean {
  return (contrasena ?? '').length >= LARGO_MINIMO_CONTRASENA;
}

/**
 * Compara en tiempo constante.
 *
 * Se comparan los hashes y no los textos: así las dos entradas miden lo
 * mismo siempre, `timingSafeEqual` no lanza por longitudes distintas y la
 * comparación no revela ni el largo de la contraseña.
 */
export function contrasenaCorrecta(recibida: string, real: string): boolean {
  return timingSafeEqual(sha256(recibida ?? ''), sha256(real));
}

/**
 * Un resumen corto de la contraseña que va dentro del token.
 *
 * Sirve para cerrar todas las sesiones de golpe: si el cliente cambia la
 * contraseña en Railway, los tokens viejos llevan el resumen viejo y dejan
 * de valer, sin esperar a que caduquen. No permite recuperar la contraseña.
 */
export function huellaContrasena(contrasena: string): string {
  return sha256(`candela-admin:${contrasena}`).toString('hex').slice(0, 16);
}

function sha256(texto: string): Buffer {
  return createHash('sha256').update(texto, 'utf8').digest();
}
