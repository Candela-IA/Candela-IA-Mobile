import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, TonoAcento, TONOS } from '../theme';

interface Props {
  children: ReactNode;
  /** Color del borde, el resplandor y el tinte del degradado. */
  tono?: TonoAcento;
  /** Intensidad del resplandor exterior. */
  intensidad?: number;
  activa?: boolean;
  onPress?: () => void;
  estilo?: ViewStyle;
  padding?: number;
}

/**
 * La tarjeta translúcida del diseño, replicada del prototipo de Figma:
 *
 *   radio 26 · borde rgba(tono, 0.28) · degradado 150° del color al carbón
 *   · hilo de luz superior · resplandor exterior del mismo tono
 *
 * El "hilo" de arriba es el detalle que la hace ver de vidrio: una línea de
 * 1px que va de transparente al color y vuelve a transparente, simulando el
 * reflejo en el canto superior.
 */
export function TarjetaGlass({
  children,
  tono = 'purpura',
  intensidad = 0.22,
  activa = false,
  onPress,
  estilo,
  padding = 16,
}: Props) {
  const t = TONOS[tono];

  const contenido = (
    <View
      style={[
        estilos.tarjeta,
        {
          padding,
          borderColor: `rgba(${t.rgb},${activa ? 0.55 : 0.28})`,
          borderWidth: activa ? 1.5 : 1,
        },
        Platform.select({
          ios: {
            shadowColor: t.hex,
            shadowOpacity: intensidad + (activa ? 0.25 : 0),
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
          },
          android: { elevation: activa ? 6 : 2 },
        }),
        estilo,
      ]}
    >
      {/* Degradado 150°: tinte del tono arriba-izquierda, carbón abajo. */}
      <LinearGradient
        colors={[
          `rgba(${t.rgb},${activa ? 0.18 : 0.1})`,
          colors.tarjeta,
          colors.oscuro.grafito,
        ]}
        locations={[0, 0.46, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Hilo de luz del canto superior. */}
      <LinearGradient
        colors={['transparent', `rgba(${t.rgb},0.6)`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={estilos.hilo}
        pointerEvents="none"
      />

      {children}
    </View>
  );

  if (!onPress) return contenido;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
      style={({ pressed }) => (pressed ? estilos.presionada : undefined)}
    >
      {contenido}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.tarjeta,
    borderRadius: 26,
    overflow: 'hidden',
  },
  hilo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  presionada: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
