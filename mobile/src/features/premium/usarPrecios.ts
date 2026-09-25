import { useEffect, useMemo, useState } from 'react';

import {
  IdPlan,
  PLANES,
  PrecioMostrado,
  PrecioTienda,
  preciosMostrados,
} from './planes';
import { preciosDeTienda } from './revenuecat';

/**
 * LOS PRECIOS DEL PAYWALL, PREGUNTADOS A LA TIENDA.
 *
 * Se consulta una vez al abrir la pantalla y, mientras la respuesta no
 * llega, se pintan los de respaldo. Eso es deliberado: el paywall no puede
 * quedarse en blanco esperando a Google, y el usuario ve un precio correcto
 * desde el primer fotograma aunque luego se reemplace por el suyo.
 *
 * Si no hay tienda —Expo Go, iOS sin la clave de Apple, o las suscripciones
 * todavía sin crear en la consola— se queda con los de respaldo y ya está.
 * Nunca falla en voz alta: un paywall roto vende menos que uno con el precio
 * en dólares.
 */
const IDENTIFICADORES = PLANES.map((p) => p.productoTienda);

export function usarPrecios(): Record<IdPlan, PrecioMostrado> {
  const [tienda, setTienda] = useState<Record<string, PrecioTienda> | null>(
    null,
  );

  useEffect(() => {
    let vivo = true;

    preciosDeTienda(IDENTIFICADORES)
      .then((precios) => {
        // El `vivo` evita avisar a una pantalla que ya se cerró, que en React
        // es un aviso en consola y en producción, memoria retenida.
        if (vivo) setTienda(precios);
      })
      .catch(() => {
        // Ya está cubierto dentro de `preciosDeTienda`; esto es el cinturón.
      });

    return () => {
      vivo = false;
    };
  }, []);

  return useMemo(() => preciosMostrados(tienda), [tienda]);
}
