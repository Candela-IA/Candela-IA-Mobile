import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, espacio, tipografia } from '../theme';

/**
 * Barra de navegación flotante: Inicio y Ajustes.
 *
 * Medidas del prototipo (`BottomNav`): alto 64, radio 28, fondo
 * rgba(17,17,24,0.86), borde #242436 y resplandor rosa proyectado hacia
 * arriba.
 *
 * Reemplaza a la barra por defecto de la navegación para poder reproducir
 * la forma flotante con márgenes del diseño.
 */

const ICONOS: Record<string, { activo: keyof typeof Ionicons.glyphMap; inactivo: keyof typeof Ionicons.glyphMap }> = {
  index: { activo: 'home', inactivo: 'home-outline' },
  ajustes: { activo: 'settings', inactivo: 'settings-outline' },
};

const ETIQUETAS: Record<string, string> = {
  index: 'Inicio',
  ajustes: 'Ajustes',
};

export function BarraInferior({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        estilos.contenedor,
        { paddingBottom: Math.max(insets.bottom, espacio.xs) },
      ]}
    >
      <View style={estilos.barra}>
        {state.routes.map((ruta, indice) => {
          const activo = state.index === indice;
          const iconos = ICONOS[ruta.name];
          const etiqueta = ETIQUETAS[ruta.name] ?? ruta.name;

          if (!iconos) return null;

          const color = activo ? colors.marca.rosa : 'rgba(255,255,255,0.45)';

          return (
            <Pressable
              key={ruta.key}
              onPress={() => {
                const evento = navigation.emit({
                  type: 'tabPress',
                  target: ruta.key,
                  canPreventDefault: true,
                });
                if (!activo && !evento.defaultPrevented) {
                  navigation.navigate(ruta.name);
                }
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={etiqueta}
              style={({ pressed }) => [
                estilos.boton,
                pressed && estilos.presionado,
              ]}
            >
              <Ionicons
                name={activo ? iconos.activo : iconos.inactivo}
                size={24}
                color={color}
              />
              <Text style={[estilos.etiqueta, { color }]}>{etiqueta}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    paddingHorizontal: espacio.lg,
    paddingTop: espacio.sm,
  },
  barra: {
    height: 64,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: espacio.xl,
    backgroundColor: 'rgba(17,17,24,0.94)',
    borderWidth: 1,
    borderColor: colors.borde,
    ...Platform.select({
      ios: {
        shadowColor: colors.marca.rosa,
        shadowOpacity: 0.5,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -8 },
      },
      android: { elevation: 12 },
    }),
  },
  boton: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: espacio.base,
    paddingVertical: espacio.xs,
  },
  presionado: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  etiqueta: {
    ...tipografia.pequeno,
    fontSize: 10,
    lineHeight: 13,
  },
});
