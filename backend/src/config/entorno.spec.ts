/**
 * El entorno es la única parte del despliegue que no se puede probar en
 * local: en Railway las variables se escriben a mano en un panel. Estas
 * pruebas fijan qué combinaciones tienen que hacer fallar el arranque, para
 * que un olvido se vea en el despliegue y no en la factura de OpenAI.
 */

import { validarEntorno } from './entorno';

const SECRETO_VALIDO = 'a'.repeat(64);

const DESARROLLO = {
  NODE_ENV: 'development',
  DATABASE_URL: 'mysql://root:x@localhost:3306/candela_ia',
  JWT_SECRET: SECRETO_VALIDO,
};

const PRODUCCION = {
  NODE_ENV: 'production',
  DATABASE_URL: 'mysql://root:x@mysql.railway.internal:3306/railway',
  JWT_SECRET: SECRETO_VALIDO,
  AI_PROVIDER: 'openai',
  OPENAI_API_KEY: 'sk-clave-de-verdad',
};

describe('validarEntorno', () => {
  it('deja pasar un entorno de desarrollo completo', () => {
    expect(() => validarEntorno({ ...DESARROLLO })).not.toThrow();
  });

  it('deja pasar un entorno de producción completo', () => {
    expect(() => validarEntorno({ ...PRODUCCION })).not.toThrow();
  });

  it('devuelve el entorno intacto para que ConfigModule lo use', () => {
    expect(validarEntorno({ ...PRODUCCION })).toEqual(PRODUCCION);
  });

  describe('base de datos', () => {
    it('exige DATABASE_URL', () => {
      expect(() =>
        validarEntorno({ ...DESARROLLO, DATABASE_URL: '' }),
      ).toThrow(/DATABASE_URL/);
    });

    it('rechaza una URL que no sea de MySQL', () => {
      expect(() =>
        validarEntorno({
          ...DESARROLLO,
          DATABASE_URL: 'postgresql://usuario:x@host:5432/candela',
        }),
      ).toThrow(/mysql/);
    });
  });

  describe('JWT_SECRET', () => {
    it('lo exige', () => {
      expect(() => validarEntorno({ ...DESARROLLO, JWT_SECRET: '' })).toThrow(
        /JWT_SECRET/,
      );
    });

    it('rechaza el valor de ejemplo del .env.example', () => {
      expect(() =>
        validarEntorno({
          ...DESARROLLO,
          JWT_SECRET: 'cambia_esto_por_algo_aleatorio_y_largo',
        }),
      ).toThrow(/ejemplo/);
    });

    it('rechaza un secreto corto', () => {
      expect(() =>
        validarEntorno({ ...DESARROLLO, JWT_SECRET: 'corto' }),
      ).toThrow(/mínimo/);
    });
  });

  describe('en producción', () => {
    it('prohíbe el proveedor falso', () => {
      expect(() =>
        validarEntorno({ ...PRODUCCION, AI_PROVIDER: 'mock' }),
      ).toThrow(/enlatadas/);
    });

    it('exige la clave de OpenAI', () => {
      expect(() =>
        validarEntorno({ ...PRODUCCION, OPENAI_API_KEY: '' }),
      ).toThrow(/OPENAI_API_KEY/);
    });

    it('rechaza la clave de ejemplo', () => {
      expect(() =>
        validarEntorno({ ...PRODUCCION, OPENAI_API_KEY: 'sk-...' }),
      ).toThrow(/OPENAI_API_KEY/);
    });

    it('exige la clave aunque no se declare AI_PROVIDER, porque el defecto es openai', () => {
      const { AI_PROVIDER: _, ...sinProveedor } = PRODUCCION;

      expect(() =>
        validarEntorno({ ...sinProveedor, OPENAI_API_KEY: '' }),
      ).toThrow(/OPENAI_API_KEY/);
    });
  });

  describe('fuera de producción', () => {
    it('permite el proveedor falso: es como se construye la app sin gastar', () => {
      expect(() =>
        validarEntorno({ ...DESARROLLO, AI_PROVIDER: 'mock' }),
      ).not.toThrow();
    });

    it('no exige la clave de OpenAI', () => {
      expect(() =>
        validarEntorno({ ...DESARROLLO, OPENAI_API_KEY: '' }),
      ).not.toThrow();
    });
  });

  it('junta todos los fallos en un solo mensaje', () => {
    expect(() =>
      validarEntorno({ NODE_ENV: 'production', AI_PROVIDER: 'mock' }),
    ).toThrow(/DATABASE_URL[\s\S]*JWT_SECRET[\s\S]*enlatadas/);
  });
});
