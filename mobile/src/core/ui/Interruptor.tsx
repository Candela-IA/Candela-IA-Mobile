import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  colors,
  degradados,
  direccionMarca,
  duracion,
  radio,
} from '../theme';

interface Props {
  valor: boolean;
  onCambiar: () => void;
  /** Se lee en voz alta y aparece en las pruebas. */
  etiqueta: string;
}

/**
 * El interruptor del diseño.
 *
 * Medidas del prototipo: 48×28, botón de 22 con 3 de margen, y el degradado
 * de marca de fondo cuando está encendido.
 *
 * No se usa el `Switch` de React Native: en Android lo pinta el sistema y
 * solo deja cambiarle el color, así que no puede llevar degradado ni el
 * resplandor rosa. Reconstruirlo es la única forma de que se vea igual en
 * los dos sistemas.
 */
export function Interruptor({ valor, onCambiar, etiqueta }: Props) {
  const progreso = useSharedValue(valor ? 1 : 0);

  useEffect(() => {
    progreso.value = withTiming(valor ? 1 : 0, {
      duration: duracion.rapida,
    });
  }, [valor, progreso]);

  const estiloBoton = useAnimatedStyle(() => ({
    transform: [{ translateX: progreso.value * 20 }],
  }));

  return (
    <Pressable
      onPress={onCambiar}
      accessibilityRole="switch"
      accessibilityState={{ checked: valor }}
      accessibilityLabel={etiqueta}
      hitSlop={8}
      style={({ pressed }) => [
        estilos.pista,
        !valor && estilos.apagado,
        valor &&
          Platform.select({
            ios: {
              shadowColor: colors.marca.rosa,
              shadowOpacity: 0.9,
              shadowRadius: 9,
              shadowOffset: { width: 0, height: 0 },
            },
            android: { elevation: 4 },
          }),
        pressed && estilos.presionado,
      ]}
    >
      {valor ? (
        <LinearGradient
          colors={degradados.marca}
          start={direccionMarca.start}
          end={direccionMarca.end}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <View style={estilos.carril}>
        <Animated.View style={[estilos.boton, estiloBoton]} />
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pista: {
    width: 48,
    height: 28,
    borderRadius: radio.pildora,
    padding: 3,
    overflow: 'hidden',
  },
  apagado: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.borde,
    // El borde de 1px come espacio por dentro; sin este ajuste el botón
    // queda 2px más abajo cuando el interruptor está apagado.
    padding: 2,
  },
  presionado: { transform: [{ scale: 0.95 }] },
  carril: { flex: 1, justifyContent: 'center' },
  boton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.texto.blanco,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
});
