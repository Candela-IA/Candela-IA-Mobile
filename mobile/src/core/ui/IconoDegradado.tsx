import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';

import { usarPreferencias } from '../di/preferencias';
import { colors, TonoAcento, TONOS } from '../theme';

interface Props {
  nombre: keyof typeof Ionicons.glyphMap;
  tono: TonoAcento;
  /** 48 en las tarjetas, 28 en las etiquetas de sección. */
  tamano?: number;
  radio?: number;
}

/**
 * El cuadradito con degradado que acompaña cada opción del diseño.
 *
 * Medidas tomadas del prototipo (`GlowIcon`): 48px, radio 16, degradado a
 * 145° de `from` a `to`, y resplandor proyectado hacia abajo.
 *
 * Recibe el nombre del tono, no un color libre: así solo se pueden usar los
 * seis de la marca y el tipado impide inventar uno nuevo.
 */
export function IconoDegradado({
  nombre,
  tono,
  tamano = 48,
  radio = 16,
}: Props) {
  const t = TONOS[tono];
  // Ajustes → Personalización → "Brillo neón".
  const brillo = usarPreferencias((estado) => estado.brilloNeon);

  return (
    <View
      style={[
        estilos.contenedor,
        { width: tamano, height: tamano, borderRadius: radio },
        brillo
          ? Platform.select({
              ios: {
                shadowColor: t.hex,
                shadowOpacity: 0.62,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
              },
              android: { elevation: 5 },
            })
          : null,
      ]}
    >
      <LinearGradient
        colors={[t.from, t.to]}
        // 145° del diseño.
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Borde interior claro: el `inset 0 0 0 1px rgba(255,255,255,0.10)`
          del prototipo, que en React Native se hace con una capa encima. */}
      <View
        style={[estilos.brilloInterior, { borderRadius: radio }]}
        pointerEvents="none"
      />
      <Ionicons
        name={nombre}
        size={Math.round(tamano * 0.46)}
        color={colors.texto.blanco}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brilloInterior: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
});
