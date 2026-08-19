import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  colors,
  degradados,
  direccionMarca,
  espacio,
  radio,
  TonoAcento,
  TONOS,
} from '../theme';
import { TextoDegradado } from './TextoDegradado';

interface Props {
  emoji: string;
  etiqueta: string;
  descripcion?: string;
  seleccionado: boolean;
  /** true si lleva corona y el usuario no tiene suscripción. */
  bloqueado?: boolean;
  tono?: TonoAcento;
  onPress: () => void;
  ancho: number;
}

/**
 * El selector de modo de respuesta.
 *
 * Medidas del prototipo (`ModeChip` / `VipChip`): radio 16, emoji en
 * cuadrado de 34, etiqueta 12px, descripción 10px. Seleccionado gana borde
 * al 65%, fondo degradado y un check con el degradado de marca.
 *
 * Los bloqueados llevan corona dorada en vez de check, etiqueta con el
 * degradado de marca y fondo con tinte ámbar: en el diseño son el anzuelo
 * de la suscripción, no una opción deshabilitada.
 */
export function ChipTono({
  emoji,
  etiqueta,
  descripcion,
  seleccionado,
  bloqueado = false,
  tono = 'rosa',
  onPress,
  ancho,
}: Props) {
  const t = TONOS[bloqueado ? 'ambar' : tono];
  const activo = seleccionado && !bloqueado;

  // Con cuatro columnas el chip queda angosto y palabras como 'Misterioso'
  // se parten. Se aprieta el relleno y baja un punto la tipografía.
  const estrecho = ancho < 95;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo, disabled: false }}
      accessibilityLabel={
        bloqueado
          ? `${etiqueta}. Exclusivo de Premium.`
          : `${etiqueta}${descripcion ? `. ${descripcion}` : ''}`
      }
      style={({ pressed }) => [
        estilos.chip,
        {
          width: ancho,
          paddingHorizontal: estrecho ? espacio.sm : espacio.md,
          borderColor: activo ? `rgba(${t.rgb},0.65)` : colors.borde,
        },
        bloqueado && { borderColor: `rgba(${t.rgb},0.45)` },
        activo &&
          Platform.select({
            ios: {
              shadowColor: t.hex,
              shadowOpacity: 0.95,
              shadowRadius: 13,
              shadowOffset: { width: 0, height: 0 },
            },
            android: { elevation: 6 },
          }),
        pressed && estilos.presionado,
      ]}
    >
      {activo ? (
        <LinearGradient
          colors={[`rgba(${t.rgb},0.20)`, 'rgba(9,9,11,0.9)']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* Los premium bloqueados llevan su propio fondo dorado: son el
          anzuelo de la suscripción y tienen que destacar aunque nadie los
          haya elegido. */}
      {bloqueado ? (
        <LinearGradient
          colors={[
            'rgba(245,158,11,0.10)',
            'rgba(255,45,138,0.05)',
            'rgba(9,9,11,0.92)',
          ]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* Check con el degradado de marca cuando el tono está elegido. */}
      {activo ? (
        <LinearGradient
          colors={degradados.marca}
          start={direccionMarca.start}
          end={direccionMarca.end}
          style={estilos.insignia}
        >
          <Ionicons name="checkmark" size={11} color={colors.texto.blanco} />
        </LinearGradient>
      ) : null}

      {/* Corona, no candado. El candado dice "no puedes"; la corona dice
          "esto es lo bueno", que es lo que el diseño busca aquí. */}
      {bloqueado ? (
        <View style={estilos.corona}>
          <MaterialCommunityIcons
            name="crown"
            size={11}
            color={TONOS.ambar.from}
          />
        </View>
      ) : null}

      <View
        style={[
          estilos.cuadroEmoji,
          {
            backgroundColor: activo
              ? `rgba(${t.rgb},0.16)`
              : 'rgba(255,255,255,0.045)',
            borderColor: `rgba(${t.rgb},${activo ? 0.36 : 0.16})`,
          },
        ]}
      >
        <Text style={estilos.emoji}>{emoji}</Text>
      </View>

      {bloqueado ? (
        // Los premium llevan la etiqueta con el degradado de marca, como en
        // el diseño: es lo que hace que el bloque de arriba se lea como "lo
        // bueno" y no como una fila más de opciones.
        <TextoDegradado
          estilo={estrecho ? estilos.etiquetaEstrecha : estilos.etiqueta}
        >
          {etiqueta}
        </TextoDegradado>
      ) : (
        <Text
          style={[
            estilos.etiqueta,
            estrecho && estilos.etiquetaEstrecha,
            { color: activo ? colors.texto.blanco : 'rgba(255,255,255,0.7)' },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {etiqueta}
        </Text>
      )}

      {descripcion ? (
        <Text
          style={[estilos.descripcion, bloqueado && estilos.descripcionTenue]}
          numberOfLines={2}
        >
          {descripcion}
        </Text>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  chip: {
    borderRadius: radio.lg,
    paddingHorizontal: espacio.md,
    paddingVertical: 14,
    gap: espacio.xs,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
    overflow: 'hidden',
  },
  presionado: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  insignia: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cuadroEmoji: {
    width: 34,
    height: 34,
    borderRadius: radio.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  // Cuadrado con borde dorado, no círculo: la corona es una insignia de
  // categoría, no un botón, y el cuadrado la distingue del check redondo
  // que marca el tono elegido.
  corona: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 19,
    height: 19,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.55)',
    zIndex: 2,
  },
  emoji: { fontSize: 19, lineHeight: 24 },
  etiqueta: { fontSize: 12, lineHeight: 15, fontWeight: '600' },
  etiquetaEstrecha: { fontSize: 11, lineHeight: 14 },
  descripcion: {
    fontSize: 10,
    lineHeight: 13,
    color: 'rgba(255,255,255,0.35)',
  },
  // En los premium la descripción baja de peso para que el degradado de la
  // etiqueta sea lo que se mira primero.
  descripcionTenue: { color: 'rgba(255,255,255,0.24)' },
});
