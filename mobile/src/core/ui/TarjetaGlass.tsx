import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { usarPreferencias } from '../di/preferencias';
import { colors, TonoAcento, TONOS } from '../theme';

interface Props {
  children: ReactNode;
  /** Color del borde, el resplandor y el tinte del degradado. */
  tono?: TonoAcento;
  /** Intensidad del resplandor exterior. */
  intensidad?: number;
  activa?: boolean;
  onPress?: () => void;
  /**
   * `StyleProp` y no `ViewStyle` a secas: quien la usa necesita combinar el
   * estilo base con uno calculado en tiempo de render — por ejemplo un alto
   * que depende del tamaño de letra del sistema.
   */
  estilo?: StyleProp<ViewStyle>;
  padding?: number;
  /**
   * Añade el halo de color alrededor de la tarjeta.
   *
   * Va por petición y no siempre porque obliga a envolver la tarjeta en otra
   * vista, y eso cambia cómo se comporta dentro de una fila o una grilla.
   * Se reserva para las tarjetas protagonistas de una pantalla.
   */
  resplandor?: boolean;
}

/** Marcos del halo, de fuera hacia dentro. Ver `IconoDegradado`. */
const CAPAS_RESPLANDOR = [
  { crece: 18, opacidad: 0.07 },
  { crece: 12, opacidad: 0.09 },
  { crece: 7, opacidad: 0.11 },
  { crece: 3, opacidad: 0.13 },
];

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
  resplandor = false,
}: Props) {
  const t = TONOS[tono];
  // Ajustes → Personalización → "Brillo neón".
  const brillo = usarPreferencias((estado) => estado.brilloNeon);

  const contenido = (
    <View
      style={[
        estilos.tarjeta,
        {
          padding,
          borderColor: `rgba(${t.rgb},${activa ? 0.55 : 0.28})`,
          borderWidth: activa ? 1.5 : 1,
        },
        brillo
          ? Platform.select({
              ios: {
                shadowColor: t.hex,
                shadowOpacity: intensidad + (activa ? 0.35 : 0.12),
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 8 },
              },
              android: { elevation: activa ? 10 : 4 },
            })
          : null,
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

  const conHalo =
    resplandor && brillo ? (
      // Sin recorte y sin estilo propio: solo aloja las capas del halo, que
      // tienen que poder salirse de la tarjeta.
      <View>
        {CAPAS_RESPLANDOR.map((capa) => (
          <View
            key={capa.crece}
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -capa.crece,
              bottom: -capa.crece,
              left: -capa.crece,
              right: -capa.crece,
              borderRadius: 26 + capa.crece,
              backgroundColor: `rgba(${t.rgb},${capa.opacidad})`,
            }}
          />
        ))}
        {contenido}
      </View>
    ) : (
      contenido
    );

  if (!onPress) return conHalo;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
      style={({ pressed }) => (pressed ? estilos.presionada : undefined)}
    >
      {conHalo}
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
