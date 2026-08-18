import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import {
  colors,
  degradados,
  direccionMarca,
  espacio,
  radio,
  tipografia,
} from '../theme';

interface Props {
  titulo: string;
  onPress: () => void;
  /** Texto pequeño bajo el título, como en el botón del paywall. */
  subtitulo?: string;
  /** Icono a la derecha: la flecha "→" del onboarding, por ejemplo. */
  iconoDerecha?: ReactNode;
  iconoIzquierda?: ReactNode;
  deshabilitado?: boolean;
  cargando?: boolean;
  estilo?: ViewStyle;
}

/**
 * El botón principal de Candela: degradado rosa → morado → azul.
 *
 * Aparece en todas las pantallas del diseño ("Comenzar", "Continuar",
 * "Analizar chat", "Copiar y usar"), así que centralizarlo garantiza que
 * todos se vean y se sientan igual.
 */
export function BotonDegradado({
  titulo,
  onPress,
  subtitulo,
  iconoDerecha,
  iconoIzquierda,
  deshabilitado = false,
  cargando = false,
  estilo,
}: Props) {
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      accessibilityLabel={subtitulo ? `${titulo}. ${subtitulo}` : titulo}
      // Se atenúa al presionar. En el estado deshabilitado el diseño baja
      // el botón a gris plano, así que ahí no hace falta más feedback.
      style={({ pressed }) => [
        estilos.contenedor,
        estilo,
        pressed && !inactivo && estilos.presionado,
      ]}
    >
      {inactivo ? (
        <View style={[estilos.degradado, estilos.inactivo]}>
          {cargando ? (
            <ActivityIndicator color={colors.texto.tenue} />
          ) : (
            <Texto titulo={titulo} subtitulo={subtitulo} atenuado />
          )}
        </View>
      ) : (
        <LinearGradient
          colors={degradados.marca}
          start={direccionMarca.start}
          end={direccionMarca.end}
          style={estilos.degradado}
        >
          {iconoIzquierda}
          <Texto titulo={titulo} subtitulo={subtitulo} />
          {iconoDerecha}
        </LinearGradient>
      )}
    </Pressable>
  );
}

function Texto({
  titulo,
  subtitulo,
  atenuado = false,
}: {
  titulo: string;
  subtitulo?: string;
  atenuado?: boolean;
}) {
  const color = atenuado ? colors.texto.tenue : colors.texto.blanco;

  return (
    <View style={estilos.textos}>
      <Text style={[estilos.titulo, { color }]}>{titulo}</Text>
      {subtitulo ? (
        <Text
          style={[
            estilos.subtitulo,
            { color: atenuado ? colors.texto.tenue : 'rgba(255,255,255,0.75)' },
          ]}
        >
          {subtitulo}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    borderRadius: radio.pildora,
    overflow: 'hidden',
  },
  presionado: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  degradado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.sm,
    paddingVertical: espacio.base + 2,
    paddingHorizontal: espacio.xl,
    minHeight: 56,
  },
  inactivo: {
    backgroundColor: colors.tarjeta,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  textos: {
    alignItems: 'center',
  },
  titulo: {
    ...tipografia.boton,
  },
  subtitulo: {
    ...tipografia.pequeno,
    marginTop: 2,
  },
});
