import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors, degradados, direccionMarca, radio } from '../theme';

interface Props {
  total: number;
  actual: number;
}

/**
 * Los segmentos del onboarding: el activo se pinta con el degradado de
 * marca y es más ancho; los demás quedan apagados.
 *
 * Se declara como una sola imagen accesible con su texto ("paso 2 de 5")
 * en vez de cinco vistas sueltas, para que un lector de pantalla anuncie
 * el progreso y no cinco elementos sin significado.
 */
export function IndicadorProgreso({ total, actual }: Props) {
  return (
    <View
      style={estilos.fila}
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${actual + 1} de ${total}`}
    >
      {Array.from({ length: total }).map((_, i) =>
        i === actual ? (
          <LinearGradient
            key={i}
            colors={degradados.marca}
            start={direccionMarca.start}
            end={direccionMarca.end}
            style={[estilos.segmento, estilos.activo]}
          />
        ) : (
          <View
            key={i}
            style={[
              estilos.segmento,
              i < actual ? estilos.completado : estilos.pendiente,
            ]}
          />
        ),
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmento: {
    height: 4,
    borderRadius: radio.pildora,
  },
  activo: {
    width: 26,
  },
  completado: {
    width: 16,
    backgroundColor: colors.marca.purpura,
    opacity: 0.5,
  },
  pendiente: {
    width: 16,
    backgroundColor: colors.borde,
  },
});
