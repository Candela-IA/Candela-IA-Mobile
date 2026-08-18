import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, espacio, tipografia, TonoAcento } from '../theme';
import { IconoDegradado } from './IconoDegradado';
import { TextoDegradado } from './TextoDegradado';

interface Props {
  icono: keyof typeof Ionicons.glyphMap;
  tono: TonoAcento;
  titulo: string;
  subtitulo: string;
  /** Pinta el título con el degradado de marca (la fila de Premium). */
  destacado?: boolean;
  /** Navega y muestra la flecha. Se ignora si hay `derecha`. */
  onPress?: () => void;
  /** Contenido a la derecha en lugar de la flecha: un interruptor. */
  derecha?: ReactNode;
  /** Aire vertical. Las filas sueltas respiran más que las agrupadas. */
  compacta?: boolean;
}

/**
 * Una fila de Ajustes: icono, título, descripción y algo a la derecha.
 *
 * Sirve para las tres formas que usa el diseño —tarjeta suelta que navega,
 * fila dentro de un grupo, y fila con interruptor— porque las tres tienen la
 * misma anatomía y solo cambia lo de la derecha.
 */
export function FilaAjuste({
  icono,
  tono,
  titulo,
  subtitulo,
  destacado = false,
  onPress,
  derecha,
  compacta = false,
}: Props) {
  const contenido = (
    <View style={[estilos.fila, compacta && estilos.filaCompacta]}>
      <IconoDegradado nombre={icono} tono={tono} tamano={44} radio={14} />

      <View style={estilos.textos}>
        {destacado ? (
          <TextoDegradado estilo={estilos.titulo}>{titulo}</TextoDegradado>
        ) : (
          <Text style={estilos.titulo}>{titulo}</Text>
        )}
        <Text style={estilos.subtitulo}>{subtitulo}</Text>
      </View>

      {derecha ?? (
        onPress ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,45,138,0.8)"
          />
        ) : null
      )}
    </View>
  );

  // Una fila con interruptor no se pulsa entera: el destino de la pulsación
  // es el interruptor, y hacer que toda la fila lo alterne sorprende a quien
  // solo quería desplazar la lista.
  if (!onPress || derecha) return contenido;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${subtitulo}`}
      style={({ pressed }) => (pressed ? estilos.presionada : undefined)}
    >
      {contenido}
    </Pressable>
  );
}

/** La línea que separa dos filas dentro de un mismo grupo. */
export function SeparadorAjuste() {
  return <View style={estilos.separador} />;
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.base,
    paddingHorizontal: espacio.base,
    paddingVertical: espacio.base,
  },
  filaCompacta: { paddingVertical: 14 },
  presionada: { opacity: 0.7 },
  textos: { flex: 1 },
  titulo: {
    ...tipografia.cuerpo,
    fontWeight: '600',
    color: colors.texto.blanco,
  },
  subtitulo: {
    ...tipografia.pequeno,
    fontSize: 12,
    color: 'rgba(255,255,255,0.42)',
    marginTop: 2,
  },
  separador: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: espacio.base,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
