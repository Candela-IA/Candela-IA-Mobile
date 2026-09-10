import { ErrorApi } from '../../core/api/cliente';

/**
 * QUÉ DECIRLE AL USUARIO CUANDO NO SE PUDO GENERAR.
 *
 * Antes todo caía en el mismo "No pudimos generar. Algo salió mal", y eso
 * trataba igual dos cosas que no se parecen en nada: ir demasiado rápido
 * —que se arregla esperando diez segundos— y una avería de verdad. El
 * usuario leía "algo salió mal" cuando no había salido mal nada, y se
 * quedaba sin saber si insistir o rendirse.
 *
 * El backend ya las distingue con su `codigo`, que es estable y no cambia
 * aunque se reescriba el texto. Aquí solo hay que ponerle las palabras.
 */

export interface AvisoDeFallo {
  readonly titulo: string;
  readonly mensaje: string;
}

const GENERICO: AvisoDeFallo = {
  titulo: 'No pudimos generar',
  mensaje: 'Algo salió mal. Intenta de nuevo.',
};

export function describirFallo(error: unknown): AvisoDeFallo {
  if (!(error instanceof ErrorApi)) {
    return error instanceof Error && error.message
      ? { titulo: GENERICO.titulo, mensaje: error.message }
      : GENERICO;
  }

  switch (error.codigo) {
    // Ritmo, no avería. Es importante que no diga "algo salió mal": no se
    // rompió nada y esperar un momento lo arregla.
    case 'GENERACION_A_TOPE':
      return {
        titulo: 'Vas muy rápido',
        mensaje: 'Espera unos segundos y vuelve a intentar.',
      };

    // El tope de uso justo de los suscriptores. El número lo pone el
    // backend, que es quien lo decide; aquí solo se le añade la hora a la
    // que vuelve, que depende del teléfono.
    case 'LIMITE_DIARIO': {
      const hora = horaDeVuelta(error.reiniciaEn);

      return {
        titulo: 'Llegaste al límite de hoy',
        mensaje: hora ? `${error.message} Vuelven a ${hora}.` : error.message,
      };
    }

    case 'SIN_CONEXION':
      return { titulo: 'Sin conexión', mensaje: error.message };

    default:
      return { titulo: GENERICO.titulo, mensaje: error.message };
  }
}

/**
 * La hora local a la que vuelve el cupo, en cristiano.
 *
 * El backend manda la fecha en ISO y no un texto porque el contador se
 * reinicia a medianoche UTC, y eso cae a una hora distinta en cada país: las
 * 7 de la tarde en Perú, las 6 en México. Quien sabe la zona horaria es el
 * teléfono.
 *
 * Se formatea a mano en vez de con `toLocaleTimeString` para no depender de
 * que el motor traiga Intl, que en Android no siempre viene completo — y un
 * formato roto aquí deja el aviso diciendo "Vuelven a las Invalid Date".
 *
 * Devuelve la frase con su artículo puesto ("las 7 de la tarde",
 * "medianoche") porque "a las medianoche" no se dice, y el artículo depende
 * de la hora que salga.
 */
export function horaDeVuelta(iso?: string): string | null {
  if (!iso) return null;

  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;

  const h24 = fecha.getHours();
  const minutos = fecha.getMinutes();

  // Las dos horas que tienen nombre propio. Y son justo las que salen: el
  // cupo vuelve al terminar el día.
  if (minutos === 0 && h24 === 0) return 'medianoche';
  if (minutos === 0 && h24 === 12) return 'mediodía';

  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const reloj =
    minutos === 0 ? `${h12}` : `${h12}:${String(minutos).padStart(2, '0')}`;

  return `las ${reloj} ${franja(h24)}`;
}

/** "de la tarde" suena a persona; "p. m." suena a formulario. */
function franja(h24: number): string {
  if (h24 < 6) return 'de la madrugada';
  if (h24 < 12) return 'de la mañana';
  if (h24 < 20) return 'de la tarde';
  return 'de la noche';
}
