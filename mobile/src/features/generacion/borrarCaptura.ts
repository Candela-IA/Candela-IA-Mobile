import { File } from 'expo-file-system';

/**
 * BORRA LA COPIA COMPRIMIDA DE UNA CAPTURA
 *
 * Al comprimir, `expo-image-manipulator` escribe un JPEG nuevo en la caché
 * de la app. Ese archivo no lo limpia nadie: se queda hasta que Android
 * decida vaciar la caché, que pueden ser semanas.
 *
 * Y no es un archivo cualquiera. Son capturas de conversaciones privadas de
 * terceros que ni siquiera usan la app. La promesa de los Términos —"usaremos
 * el contenido solo para prestar la función pedida"— obliga a borrarlas en
 * cuanto la función terminó, no a dejarlas acumulándose en el teléfono.
 *
 * Solo toca la copia que hacemos nosotros. El original de la galería del
 * usuario no se toca jamás: es suyo.
 */
export function borrarCaptura(uri: string | undefined | null): void {
  if (!uri) return;

  try {
    const archivo = new File(uri);

    // `exists` evita el error cuando ya se borró — pasa al salir de la
    // pantalla justo después de haber cambiado de captura.
    if (archivo.exists) archivo.delete();
  } catch {
    // Que no se pueda borrar no es motivo para romperle la pantalla al
    // usuario. Peor caso: el archivo sobrevive hasta que el sistema limpie
    // la caché, que es exactamente lo que pasaba antes de este módulo.
  }
}
