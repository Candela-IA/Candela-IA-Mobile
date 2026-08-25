import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, espacio, radio, tipografia } from '../theme';

interface Props {
  titulo: string;
  onPress: () => void;
  /** Icono a la izquierda del texto. En el diseño va siempre en rosa. */
  iconoIzquierda?: ReactNode;
  deshabilitado?: boolean;
  estilo?: ViewStyle;
}

/**
 * La acción secundaria: mismo tamaño que `BotonDegradado`, pero de contorno.
 *
 * Existe porque dos degradados seguidos compiten entre sí y ninguno se lee
 * como el principal. Cuando hay dos acciones —"Generar otra respuesta" y
 * "Copiar y usar"— el degradado marca cuál es la que empuja el producto y
 * el contorno acompaña sin robar la mirada.
 */
export function BotonFantasma({
  titulo,
  onPress,
  iconoIzquierda,
  deshabilitado = false,
  estilo,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      accessibilityLabel={titulo}
      style={({ pressed }) => [
        estilos.contenedor,
        estilo,
        pressed && !deshabilitado && estilos.presionado,
        deshabilitado && estilos.inactivo,
      ]}
    >
      {iconoIzquierda}
      <Text
        style={[estilos.texto, deshabilitado && estilos.textoInactivo]}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.sm,
    minHeight: 56,
    paddingVertical: espacio.base + 2,
    paddingHorizontal: espacio.xl,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  presionado: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  inactivo: { opacity: 0.45 },
  texto: { ...tipografia.boton, color: colors.texto.blanco },
  textoInactivo: { color: colors.texto.tenue },
});
