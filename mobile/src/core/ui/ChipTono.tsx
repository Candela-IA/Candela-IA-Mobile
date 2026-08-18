import { Ionicons } from '@expo/vector-icons';
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
 * Los bloqueados usan ámbar y muestran candado en vez de check — el ámbar
 * es el color de premium en toda la app.
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

      {/* Insignia: check si está elegido, candado si es premium bloqueado. */}
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

      {bloqueado ? (
        <View style={[estilos.insignia, { backgroundColor: t.hex }]}>
          <Ionicons name="lock-closed" size={10} color={colors.texto.blanco} />
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

      {descripcion ? (
        <Text style={estilos.descripcion} numberOfLines={2}>
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
  emoji: { fontSize: 19, lineHeight: 24 },
  etiqueta: { fontSize: 12, lineHeight: 15, fontWeight: '600' },
  etiquetaEstrecha: { fontSize: 11, lineHeight: 14 },
  descripcion: {
    fontSize: 10,
    lineHeight: 13,
    color: 'rgba(255,255,255,0.35)',
  },
});
