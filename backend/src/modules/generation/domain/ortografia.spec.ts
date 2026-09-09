/**
 * El caso que originó esto está en la primera prueba: es el mensaje literal
 * que salió del lote del 9 de septiembre de 2026.
 */

import { asegurarMayusculaInicial } from './ortografia';

describe('asegurarMayusculaInicial', () => {
  it('arregla el mensaje que se coló en el lote', () => {
    const salido = 'gracias, me salvaste. ya entro antes de que el código se rebele otra vez jaja';

    const { mensaje, corregido } = asegurarMayusculaInicial(salido);

    expect(mensaje).toBe(
      'Gracias, me salvaste. ya entro antes de que el código se rebele otra vez jaja',
    );
    expect(corregido).toBe(true);
  });

  it('no toca el que ya venía bien', () => {
    const bueno = 'Jajaja, no puede ser. ¿Y qué hiciste?';

    expect(asegurarMayusculaInicial(bueno)).toEqual({
      mensaje: bueno,
      corregido: false,
    });
  });

  it('busca la primera LETRA, no el primer carácter', () => {
    // Abrir con "¿" es correcto: la mayúscula va en la letra siguiente.
    expect(asegurarMayusculaInicial('¿qué tal?').mensaje).toBe('¿Qué tal?');
    expect(asegurarMayusculaInicial('¡ya era hora!').mensaje).toBe('¡Ya era hora!');
    expect(asegurarMayusculaInicial('"eso" dijiste').mensaje).toBe('"Eso" dijiste');
  });

  it('deja pasar los emojis de delante', () => {
    expect(asegurarMayusculaInicial('😏 te vi').mensaje).toBe('😏 Te vi');
  });

  it('acentúa bien la mayúscula', () => {
    expect(asegurarMayusculaInicial('ándate con cuidado').mensaje).toBe(
      'Ándate con cuidado',
    );
  });

  it('aguanta un mensaje sin letras', () => {
    expect(asegurarMayusculaInicial('123 :)')).toEqual({
      mensaje: '123 :)',
      corregido: false,
    });
    expect(asegurarMayusculaInicial('')).toEqual({ mensaje: '', corregido: false });
  });
});
