/**
 * El banco de rompehielos es lo que ve TODO usuario gratis que toque esa
 * función, así que sus reglas valen tanto como las del prompt. Estas pruebas
 * fijan lo que no puede colarse el día que alguien añada frases nuevas.
 */

import { elegirRompehielos, ROMPEHIELOS } from './rompehielos';

/** Cabe cómodo en la burbuja de un chat. */
const LARGO_MAXIMO = 120;

/**
 * Frases que sirven para cualquier persona del mundo y por eso no sirven
 * para ninguna. El prompt las prohíbe explícitamente; el banco también.
 */
const PROHIBIDAS = [
  'hola linda',
  'hola preciosa',
  'hola hermosa',
  'vi tu perfil',
  'hola, ¿cómo estás?',
  'hola como estas',
];

describe('banco de rompehielos', () => {
  it('tiene los 100 que se prometieron', () => {
    expect(ROMPEHIELOS).toHaveLength(100);
  });

  it('no repite ninguno', () => {
    expect(new Set(ROMPEHIELOS).size).toBe(ROMPEHIELOS.length);
  });

  it('todos caben en la burbuja de un chat', () => {
    const largos = ROMPEHIELOS.filter((f) => f.length > LARGO_MAXIMO);

    expect(largos).toEqual([]);
  });

  it('ninguno está vacío ni tiene espacios de sobra', () => {
    for (const frase of ROMPEHIELOS) {
      expect(frase).toBe(frase.trim());
      expect(frase.length).toBeGreaterThan(10);
    }
  });

  it('ninguno usa las frases que valen para cualquiera', () => {
    for (const frase of ROMPEHIELOS) {
      const minuscula = frase.toLowerCase();

      for (const prohibida of PROHIBIDAS) {
        expect(minuscula).not.toContain(prohibida);
      }
    }
  });

  it('todos empiezan con mayúscula', () => {
    // El usuario copia esto y lo manda tal cual: la falta acabaría siendo
    // suya delante de la persona que le gusta.
    const malos = ROMPEHIELOS.filter((f) => {
      const primera = f[0]!;
      // Los que abren con "¿" o "¡" se miden por la letra siguiente.
      const letra = primera === '¿' || primera === '¡' ? f[1]! : primera;
      return letra !== letra.toUpperCase();
    });

    expect(malos).toEqual([]);
  });

  it('todos cierran con puntuación', () => {
    const malos = ROMPEHIELOS.filter((f) => !/[.?!]$/.test(f));

    expect(malos).toEqual([]);
  });

  it('las preguntas llevan el signo de apertura', () => {
    const malos = ROMPEHIELOS.filter(
      (f) => f.endsWith('?') && !f.includes('¿'),
    );

    expect(malos).toEqual([]);
  });

  it('ninguno inventa datos de la otra persona', () => {
    // Un rompehielos no sabe el nombre de nadie. Si aparece un hueco de
    // plantilla, alguien lo dejó a medias.
    for (const frase of ROMPEHIELOS) {
      expect(frase).not.toMatch(/\{|\}|\[nombre\]|<nombre>/i);
    }
  });
});

describe('elegirRompehielos', () => {
  it('devuelve siempre uno del banco', () => {
    for (let i = 0; i < 100; i++) {
      expect(ROMPEHIELOS).toContain(elegirRompehielos());
    }
  });

  it('nunca repite el que el usuario ya tiene en pantalla', () => {
    const anterior = ROMPEHIELOS[0]!;

    for (let i = 0; i < 200; i++) {
      expect(elegirRompehielos(anterior)).not.toBe(anterior);
    }
  });

  it('aguanta que le pasen algo que no está en el banco', () => {
    expect(ROMPEHIELOS).toContain(elegirRompehielos('esto no existe'));
  });

  it('reparte entre varias frases, no devuelve siempre la misma', () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 200; i++) vistos.add(elegirRompehielos());

    // Con 50 frases y 200 tiradas, ver menos de 20 distintas señalaría que
    // el reparto está roto.
    expect(vistos.size).toBeGreaterThan(20);
  });
});
