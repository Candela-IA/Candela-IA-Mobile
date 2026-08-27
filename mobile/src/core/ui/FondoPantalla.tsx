import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { usarPreferencias } from '../di/preferencias';
import { ANCHO_MAXIMO_CONTENIDO, colors, degradados } from '../theme';

/**
 * Fondo de todas las pantallas: auras de color latiendo y partículas.
 *
 * Todo se puede apagar desde Ajustes → Personalización, tal como el diseño.
 */

interface Props {
  children: ReactNode;
  /**
   * Fuerza el estado de las auras ignorando lo que diga Ajustes. Sin valor
   * manda la preferencia del usuario, que es lo normal.
   */
  animaciones?: boolean;
  /** Igual que `animaciones`, para las partículas. */
  particulas?: boolean;
}

/**
 * Los destellos del fondo.
 *
 * Estaban en 14 partículas de 2-4 px con opacidad entre 0.12 y 0.57: tan
 * sutiles que el interruptor de Ajustes → Personalización parecía roto,
 * porque encenderlas y apagarlas se veía igual. Un ajuste que no se nota es
 * peor que no tenerlo — el usuario concluye que la app no le hace caso.
 *
 * Con estos valores se ven, sin llegar a competir con el contenido: siguen
 * detrás de todo y nunca por encima del texto.
 */
const CANTIDAD_PARTICULAS = 26;
const OPACIDAD_MINIMA = 0.28;
const RANGO_OPACIDAD = 0.55;

/**
 * Capas del aura, simulando el `filter: blur(120px)` del prototipo web.
 *
 * React Native no tiene ese filtro, y un `borderRadius` grande da un disco
 * de canto duro. La solución es apilar muchos círculos concéntricos con
 * opacidad MUY baja cada uno: en el centro se acumulan todos (~0.17) y
 * hacia afuera solo queda el último (0.012), que es invisible. Así el borde
 * desaparece en vez de cortarse.
 *
 * La clave está en el número de capas, no en la opacidad de cada una: con
 * pocas capas el filo del círculo mayor sigue viéndose por más que se baje
 * su opacidad.
 */
const CAPAS_AURA = Array.from({ length: 14 }, (_, i) => ({
  escala: 1 - i * 0.062,
  // Subida desde 0.012, que acumulaba ~0.17 en el centro y no se distinguía
  // del fondo: apagar las animaciones no cambiaba nada a la vista. Con 0.022
  // el centro llega a ~0.31 y las burbujas se leen como burbujas.
  opacidad: 0.022,
}));

export function FondoPantalla({ children, animaciones, particulas }: Props) {
  // Se lee aquí y no en cada pantalla: así los cinco sitios que usan este
  // fondo obedecen a Ajustes sin que ninguno tenga que acordarse.
  //
  // Un selector por valor, nunca uno que devuelva un objeto: zustand compara
  // con `Object.is`, y un objeto nuevo en cada render se ve siempre distinto
  // del anterior, lo que dispara un bucle de re-renderizado.
  const auras = usarPreferencias((estado) => estado.animacionesFondo);
  const destellos = usarPreferencias((estado) => estado.particulasFlotantes);

  const conAuras = animaciones ?? auras;
  const conParticulas = particulas ?? destellos;

  return (
    <View style={estilos.raiz}>
      <LinearGradient colors={degradados.pantalla} style={StyleSheet.absoluteFill} />

      {conAuras ? <Auras /> : null}
      {conParticulas ? <Particulas /> : null}

      <View style={estilos.contenido}>{children}</View>
    </View>
  );
}

function Auras() {
  const { width, height } = useWindowDimensions();
  const pulso = useSharedValue(0);

  useEffect(() => {
    pulso.value = withRepeat(
      withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulso]);

  const base = width * 1.5;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Aura
        color={colors.marca.rosa}
        tamano={base}
        pulso={pulso}
        posicion={{ top: -base * 0.55, left: -base * 0.3 }}
      />
      <Aura
        color={colors.marca.purpura}
        tamano={base}
        pulso={pulso}
        posicion={{ top: height * 0.55, left: width - base * 0.55 }}
      />
    </View>
  );
}

function Aura({
  color,
  tamano,
  pulso,
  posicion,
}: {
  color: string;
  tamano: number;
  pulso: { value: number };
  posicion: { top: number; left: number };
}) {
  const estiloPulso = useAnimatedStyle(() => ({
    opacity: 0.55 + pulso.value * 0.45,
  }));

  return (
    <Animated.View
      style={[
        estilos.grupoAura,
        estiloPulso,
        { width: tamano, height: tamano, ...posicion },
      ]}
    >
      {CAPAS_AURA.map((capa, indice) => (
        <View
          key={indice}
          style={[
            estilos.capaAura,
            {
              width: tamano * capa.escala,
              height: tamano * capa.escala,
              borderRadius: (tamano * capa.escala) / 2,
              backgroundColor: color,
              opacity: capa.opacidad,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

function Particulas() {
  const { width, height } = useWindowDimensions();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: CANTIDAD_PARTICULAS }).map((_, i) => (
        <Particula key={i} indice={i} ancho={width} alto={height} />
      ))}
    </View>
  );
}

const COLORES_PARTICULA = [
  colors.marca.rosa,
  colors.marca.purpura,
  colors.marca.azul,
  colors.marca.cian,
  colors.texto.blanco,
];

function Particula({
  indice,
  ancho,
  alto,
}: {
  indice: number;
  ancho: number;
  alto: number;
}) {
  const progreso = useSharedValue(0);

  // Posición determinista a partir del índice: si fuera aleatoria, las
  // partículas saltarían de sitio en cada re-render.
  const x = ((indice * 137) % 100) / 100;
  const y = ((indice * 251) % 100) / 100;
  const tamano = 2 + (indice % 4);
  const color = COLORES_PARTICULA[indice % COLORES_PARTICULA.length]!;
  const duracion = 4000 + (indice % 5) * 900;
  // Que no suban todas lo mismo: el recorrido desigual es lo que hace que
  // parezcan flotar en vez de desplazarse en bloque.
  const recorrido = 30 + (indice % 4) * 14;

  useEffect(() => {
    progreso.value = withRepeat(
      withTiming(1, { duration: duracion, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progreso, duracion]);

  const estilo = useAnimatedStyle(() => ({
    opacity: OPACIDAD_MINIMA + progreso.value * RANGO_OPACIDAD,
    transform: [{ translateY: -progreso.value * recorrido }],
  }));

  return (
    <Animated.View
      style={[
        estilos.particula,
        estilo,
        {
          left: x * ancho,
          top: y * alto,
          width: tamano,
          height: tamano,
          borderRadius: tamano,
          backgroundColor: color,
          // El halo es lo que las convierte en destellos y no en puntos
          // planos. En Android `shadowColor` no pinta, así que ahí el
          // relieve lo da `elevation`.
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: tamano * 2.5,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        },
      ]}
    />
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    flex: 1,
    // En tablets el contenido se queda al ancho de un teléfono y se centra,
    // en vez de estirarse de lado a lado. El fondo de detrás sí ocupa la
    // pantalla entera, así que no se ven franjas muertas a los lados.
    width: '100%',
    maxWidth: ANCHO_MAXIMO_CONTENIDO,
    alignSelf: 'center',
  },
  grupoAura: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capaAura: {
    position: 'absolute',
  },
  particula: {
    position: 'absolute',
  },
});
