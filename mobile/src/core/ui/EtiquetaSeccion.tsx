import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, espacio, TonoAcento, tipografia } from '../theme';
import { IconoDegradado } from './IconoDegradado';

/**
 * El encabezado de cada bloque dentro de una pantalla: "Captura de la
 * conversación", "Modo de respuesta", "Dale el contexto a la IA".
 *
 * Icono de 28 con radio 10, según el prototipo (`SectionLabel`).
 */
export function EtiquetaSeccion({
  icono,
  tono = 'purpura',
  children,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  tono?: TonoAcento;
  children: string;
}) {
  return (
    <View style={estilos.fila}>
      <IconoDegradado nombre={icono} tono={tono} tamano={28} radio={10} />
      <Text style={estilos.texto}>{children}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.sm,
    marginBottom: espacio.md,
  },
  texto: {
    ...tipografia.cuerpoFuerte,
    fontSize: 16,
    color: colors.texto.blanco,
    flex: 1,
  },
});
