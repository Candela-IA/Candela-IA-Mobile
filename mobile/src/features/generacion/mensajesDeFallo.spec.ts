/**
 * Este archivo decide lo único que el usuario llega a leer cuando algo falla,
 * así que sus ramas valen tanto como las del backend.
 */

import { describirFallo, horaDeVuelta } from './mensajesDeFallo';
import { ErrorApi } from '../../core/api/cliente';

describe('describirFallo', () => {
  it('la ráfaga no dice que algo salió mal, porque no salió mal nada', () => {
    const error = new ErrorApi(
      'GENERACION_A_TOPE',
      'Vas muy rápido. Espera unos segundos y vuelve a intentar.',
      429,
      true,
    );

    expect(describirFallo(error)).toEqual({
      titulo: 'Vas muy rápido',
      mensaje: 'Espera unos segundos y vuelve a intentar.',
    });
  });

  it('el tope diario dice a qué hora vuelve', () => {
    // Mediodía UTC para que la franja no dependa de la zona horaria de quien
    // corra la prueba: se construye la fecha en hora local.
    const vuelve = new Date();
    vuelve.setHours(19, 0, 0, 0);

    const error = new ErrorApi(
      'LIMITE_DIARIO',
      'Alcanzaste el límite de 50 generaciones por hoy.',
      429,
      false,
      vuelve.toISOString(),
    );

    expect(describirFallo(error)).toEqual({
      titulo: 'Llegaste al límite de hoy',
      mensaje:
        'Alcanzaste el límite de 50 generaciones por hoy. Vuelven a las 7 de la tarde.',
    });
  });

  it('si el backend no manda la hora, no se la inventa', () => {
    const error = new ErrorApi(
      'LIMITE_DIARIO',
      'Alcanzaste el límite de 50 generaciones por hoy.',
      429,
      false,
    );

    expect(describirFallo(error).mensaje).toBe(
      'Alcanzaste el límite de 50 generaciones por hoy.',
    );
  });

  it('un fallo de verdad se queda con el genérico', () => {
    const error = new ErrorApi(
      'GENERACION_FALLIDA',
      'No pudimos generar la respuesta. Intenta de nuevo.',
      503,
      true,
    );

    expect(describirFallo(error)).toEqual({
      titulo: 'No pudimos generar',
      mensaje: 'No pudimos generar la respuesta. Intenta de nuevo.',
    });
  });

  it('aguanta lo que no es un ErrorApi', () => {
    expect(describirFallo(new Error('se cayó el mundo'))).toEqual({
      titulo: 'No pudimos generar',
      mensaje: 'se cayó el mundo',
    });

    expect(describirFallo('esto no es un error')).toEqual({
      titulo: 'No pudimos generar',
      mensaje: 'Algo salió mal. Intenta de nuevo.',
    });
  });
});

describe('horaDeVuelta', () => {
  const aLas = (hora: number, minutos = 0) => {
    const fecha = new Date();
    fecha.setHours(hora, minutos, 0, 0);
    return horaDeVuelta(fecha.toISOString());
  };

  it('usa la franja del día en vez de "p. m."', () => {
    expect(aLas(3)).toBe('3 de la madrugada');
    expect(aLas(9)).toBe('9 de la mañana');
    expect(aLas(19)).toBe('7 de la tarde');
    expect(aLas(22)).toBe('10 de la noche');
  });

  it('las horas en punto no arrastran ":00"', () => {
    expect(aLas(19)).toBe('7 de la tarde');
    expect(aLas(19, 30)).toBe('7:30 de la tarde');
  });

  it('medianoche y mediodía no salen como "0"', () => {
    expect(aLas(0)).toBe('12 de la madrugada');
    expect(aLas(12)).toBe('12 de la tarde');
  });

  it('no revienta con basura', () => {
    expect(horaDeVuelta(undefined)).toBeNull();
    expect(horaDeVuelta('esto no es una fecha')).toBeNull();
  });
});
