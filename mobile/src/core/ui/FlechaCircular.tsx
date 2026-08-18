import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';

import { colors, TonoAcento, TONOS } from '../theme';

/**
 * El botón circular con flecha de las tarjetas del home.
 *
 * Medidas del prototipo (`CircleArrow`): 36px, fondo blanco al 7%, borde
 * del tono al 35% y resplandor del mismo tono.
 */
export function FlechaCircular({ tono }: { tono: TonoAcento }) {
  const t = TONOS[tono];

  return (
    <View
      style={[
        estilos.circulo,
        { borderColor: `rgba(${t.rgb},0.35)` },
        Platform.select({
          ios: {
            shadowColor: t.hex,
            shadowOpacity: 0.8,
            shadowRadius: 9,
            shadowOffset: { width: 0, height: 0 },
          },
          android: { elevation: 3 },
        }),
      ]}
    >
      <Ionicons name="arrow-forward" size={16} color={colors.texto.blanco} />
    </View>
  );
}

const estilos = StyleSheet.create({
  circulo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
  },
});
