import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, espacio, radio, tipografia } from '../theme';

interface Props {
  titulo: string;
  /** Icono a la izquierda del título, como el de Instagram en Stories. */
  icono?: ReactNode;
  /** Contenido a la derecha: el contador de créditos, por ejemplo. */
  derecha?: ReactNode;
  /**
   * Qué hace la flecha. Por defecto sale de la pantalla, pero las fases de
   * una misma pantalla —analizando, resultado— necesitan volver al paso
   * anterior en vez de abandonarla.
   */
  onAtras?: () => void;
}

/**
 * Cabecera de las pantallas internas: flecha atrás, título centrado y una
 * zona libre a la derecha.
 *
 * Medidas del prototipo (`ScreenHeader`): botón de 36 con radio 16, fondo
 * blanco al 5%, borde #242436 y resplandor rosa; flecha de 16 en rosa.
 */
export function CabeceraPantalla({
  titulo,
  icono,
  derecha,
  onAtras,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[estilos.contenedor, { paddingTop: insets.top + espacio.sm }]}>
      <Pressable
        onPress={onAtras ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={8}
        style={({ pressed }) => [estilos.botonAtras, pressed && estilos.presionado]}
      >
        <Ionicons name="arrow-back" size={16} color={colors.marca.rosa} />
      </Pressable>

      <View style={estilos.centro}>
        {icono}
        <Text style={estilos.titulo} numberOfLines={1}>
          {titulo}
        </Text>
      </View>

      <View style={estilos.derecha}>{derecha}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    paddingHorizontal: espacio.lg,
    paddingBottom: espacio.md,
  },
  botonAtras: {
    width: 36,
    height: 36,
    borderRadius: radio.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.borde,
    ...Platform.select({
      ios: {
        shadowColor: colors.marca.rosa,
        shadowOpacity: 0.7,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 3 },
    }),
  },
  presionado: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  centro: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.sm,
  },
  titulo: { ...tipografia.seccion, color: colors.texto.blanco },
  derecha: { minWidth: 36, alignItems: 'flex-end' },
});
