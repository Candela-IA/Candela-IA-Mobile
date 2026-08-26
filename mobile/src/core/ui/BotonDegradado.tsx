import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

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
/** Ancho de la banda de luz que barre el botón, y cada cuánto lo cruza. */
const ANCHO_BRILLO = 48;
const DURACION_BRILLO = 3600;

/**
 * Tope al tamaño de letra del sistema dentro del botón.
 *
 * Android deja subir la letra bastante más que esto. Respetarlo sin límite
 * parte el título en dos líneas; ignorarlo del todo
 * (allowFontScaling={false}) deja fuera a quien de verdad lo necesita. 1.3
 * es el punto donde el botón sigue creciendo con la preferencia del sistema
 * sin romperse.
 */
const MAX_ESCALA_FUENTE = 1.3;

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

  // El barrido necesita saber cuánto tiene que recorrer, y eso solo se sabe
  // cuando el botón ya se midió.
  const [ancho, setAncho] = useState(0);
  const progreso = useSharedValue(0);

  useEffect(() => {
    if (!ancho || inactivo) return;

    progreso.value = 0;
    progreso.value = withRepeat(
      withTiming(1, {
        duration: DURACION_BRILLO,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false,
    );
  }, [ancho, inactivo, progreso]);

  const estiloBrillo = useAnimatedStyle(() => ({
    // Arranca fuera por la izquierda y sale entero por la derecha.
    transform: [
      { translateX: -ANCHO_BRILLO + progreso.value * (ancho + ANCHO_BRILLO) },
    ],
  }));

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
          onLayout={(e: LayoutChangeEvent) =>
            setAncho(e.nativeEvent.layout.width)
          }
        >
          {/* Banda de luz que cruza el botón cada pocos segundos. Es lo que
              lo hace ver "vivo" sin animar nada del contenido, que si se
              moviera dificultaría leerlo. */}
          {ancho > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[estilos.brillo, estiloBrillo]}
            >
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(255,255,255,0.28)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          ) : null}

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
      <Text
        // Una sola línea, siempre. El botón principal con el texto partido en
        // dos parece un error de la app, y para provocarlo basta un teléfono
        // estrecho o el tamaño de letra del sistema subido.
        numberOfLines={1}
        // Antes de recortar con puntos suspensivos, que encoja un poco.
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        // Se respeta que alguien tenga la letra grande, pero con tope: sin
        // él, el ajuste máximo de accesibilidad de Android desborda el botón.
        maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
        style={[estilos.titulo, { color }]}
      >
        {titulo}
      </Text>
      {subtitulo ? (
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
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
  brillo: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: ANCHO_BRILLO,
  },
  inactivo: {
    backgroundColor: colors.tarjeta,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  textos: {
    alignItems: 'center',
    // Sin esto el bloque de texto no cede espacio en la fila y el titulo se
    // parte antes de aprovechar el ancho que el boton si tiene.
    flexShrink: 1,
  },
  titulo: {
    ...tipografia.boton,
  },
  subtitulo: {
    ...tipografia.pequeno,
    marginTop: 2,
  },
});
