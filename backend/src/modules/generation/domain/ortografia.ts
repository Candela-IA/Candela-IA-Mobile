/**
 * GUARDIA DE LA REGLA 1.
 *
 * El prompt exige mayúscula inicial siempre, y el modelo la cumple casi
 * siempre: en el lote del 9 de septiembre de 2026 falló 1 de 31, en Salvar
 * situación, justo después de que la voz pasara a ser gen Z. La conversación
 * de la captura estaba escrita en minúscula y el modelo copió eso también,
 * que es lo único que la regla 2 le prohíbe copiar.
 *
 * "Casi siempre" no basta para un texto que el usuario copia y manda tal cual
 * a alguien que le importa, así que aquí se garantiza.
 *
 * SOLO la mayúscula inicial. Las tildes que falten no se pueden poner sin
 * entender la frase, y ese trabajo es del prompt — este archivo no lo
 * sustituye, solo cierra el fallo que sí se puede cerrar sin interpretar nada.
 */

export interface RevisionOrtografia {
  readonly mensaje: string;
  /** `true` si hubo que corregir. El caso de uso lo registra. */
  readonly corregido: boolean;
}

/**
 * Pone en mayúscula la primera letra del mensaje.
 *
 * Busca la primera LETRA, no el primer carácter: los mensajes que abren con
 * "¿", "¡", comillas o un emoji son correctos y su mayúscula va después.
 */
export function asegurarMayusculaInicial(mensaje: string): RevisionOrtografia {
  const indice = mensaje.search(/\p{L}/u);
  if (indice === -1) return { mensaje, corregido: false };

  const letra = mensaje[indice]!;
  const mayuscula = letra.toLocaleUpperCase('es');

  // Ya estaba bien, que es el caso normal.
  if (letra === mayuscula) return { mensaje, corregido: false };

  return {
    mensaje: mensaje.slice(0, indice) + mayuscula + mensaje.slice(indice + 1),
    corregido: true,
  };
}
