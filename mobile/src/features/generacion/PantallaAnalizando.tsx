import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, duracion, espacio, radio, tipografia, TONOS } from '../../core/theme';
import { CabeceraPantalla } from '../../core/ui/CabeceraPantalla';
import { FondoPantalla } from '../../core/ui/FondoPantalla';
import { TextoDegradado } from '../../core/ui/TextoDegradado';
import { ChecklistCarga } from './ChecklistCarga';

/**
 * Alto del marco según la forma de la captura.
 *
 * Una historia de Instagram es 9:16: en una caja apaisada saldría diminuta
 * entre dos franjas negras. Con el marco alto ocupa lo que le corresponde y
 * el escaneo se ve recorriéndola de verdad.
 */
const ALTO_APAISADO = 220;
const ALTO_VERTICAL = 320;
const ALTO_LINEA = 32;

/**
 * PANTALLA DE ANÁLISIS
 *
 * Ocupa la pantalla entera mientras la IA trabaja sobre una captura, en vez
 * de reemplazar un bloque dentro del formulario.
 *
 * La diferencia importa: aquí la espera es de varios segundos y el usuario
 * acaba de entregar algo suyo. Ver su propia captura siendo escaneada
 * explica qué está pasando mucho mejor que una ruedita, y de paso confirma
 * que subió la imagen correcta.
 */
export function PantallaAnalizando({
  imagenUri,
  vertical = false,
  onCancelar,
}: {
  imagenUri?: string;
  /** Las historias son 9:16 y necesitan un marco más alto. */
  vertical?: boolean;
  onCancelar: () => void;
}) {
  const alto = vertical ? ALTO_VERTICAL : ALTO_APAISADO;

  return (
    <FondoPantalla>
      <CabeceraPantalla titulo="Analizando…" onAtras={onCancelar} />

      {/* Con scroll aunque casi siempre quepa: en pantallas cortas —o con
          la letra del sistema agrandada— la captura, los puntos, el título
          y los cuatro pasos no entran, y sin esto el último se corta. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.cuerpo}
      >
        {imagenUri ? (
          <View style={[estilos.marcoImagen, { height: alto }]}>
            <Image
              source={{ uri: imagenUri }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
            />
            <Rejilla alto={alto} />
            <LineaDeEscaneo alto={alto} />
          </View>
        ) : null}

        <Puntos />

        <TextoDegradado estilo={estilos.titulo}>
          Candela IA está analizando
        </TextoDegradado>

        <ChecklistCarga conImagen desnudo />
      </ScrollView>
    </FondoPantalla>
  );
}

/**
 * La rejilla que se superpone a la captura.
 *
 * React Native no tiene `repeating-linear-gradient`, así que las líneas se
 * dibujan una a una. Son vistas de 1px: baratas y sin imágenes de por medio.
 */
function Rejilla({ alto }: { alto: number }) {
  const lineas = Math.ceil(alto / 22);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: lineas }).map((_, i) => (
        <View key={i} style={[estilos.lineaRejilla, { top: i * 22 }]} />
      ))}
    </View>
  );
}

/** La banda de luz que recorre la captura de arriba abajo. */
function LineaDeEscaneo({ alto }: { alto: number }) {
  const progreso = useSharedValue(0);

  useEffect(() => {
    progreso.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      // Va y vuelve en vez de saltar al inicio: un salto se ve como un
      // parpadeo, no como algo recorriendo la imagen.
      true,
    );
  }, [progreso]);

  const estilo = useAnimatedStyle(() => ({
    transform: [
      { translateY: -ALTO_LINEA + progreso.value * (alto + ALTO_LINEA) },
    ],
  }));

  return (
    <Animated.View style={[estilos.linea, estilo]} pointerEvents="none">
      <LinearGradient
        colors={[
          'transparent',
          `rgba(${TONOS.cian.rgb},0.55)`,
          'transparent',
        ]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/** Los tres puntos que laten bajo la captura. */
function Puntos() {
  return (
    <View style={estilos.puntos}>
      {[0, 1, 2].map((i) => (
        <Punto key={i} indice={i} />
      ))}
    </View>
  );
}

function Punto({ indice }: { indice: number }) {
  const pulso = useSharedValue(0);

  useEffect(() => {
    // Cada punto arranca un poco después que el anterior: es lo que hace
    // que se lea como una onda y no como tres luces parpadeando a la vez.
    const id = setTimeout(() => {
      pulso.value = withRepeat(
        withTiming(1, { duration: duracion.lenta, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, indice * 160);

    return () => clearTimeout(id);
  }, [pulso, indice]);

  const estilo = useAnimatedStyle(() => ({
    opacity: 0.25 + pulso.value * 0.75,
    transform: [{ scale: 0.85 + pulso.value * 0.35 }],
  }));

  return <Animated.View style={[estilos.punto, estilo]} />;
}

const estilos = StyleSheet.create({
  cuerpo: {
    // Centrado cuando sobra sitio, desplazable cuando no.
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacio.xl,
    paddingVertical: espacio.lg,
    gap: espacio.lg,
  },

  marcoImagen: {
    width: '100%',
    maxWidth: 300,
    borderRadius: radio.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: `rgba(${TONOS.azul.rgb},0.5)`,
  },
  lineaRejilla: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: `rgba(${TONOS.azul.rgb},0.18)`,
  },
  linea: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ALTO_LINEA,
  },

  puntos: { flexDirection: 'row', gap: espacio.sm },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.marca.rosa,
  },

  titulo: { ...tipografia.cuerpoFuerte, fontSize: 16 },
});
