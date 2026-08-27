import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FUNCIONES,
  FuncionHome,
  HERO,
} from '../../src/features/home/funciones';
import {
  altoSegunFuente,
  colors,
  espacio,
  MAX_ESCALA_FUENTE,
  tipografia,
  TONOS,
} from '../../src/core/theme';
import { FlechaCircular } from '../../src/core/ui/FlechaCircular';
import { FondoPantalla } from '../../src/core/ui/FondoPantalla';
import { IconoDegradado } from '../../src/core/ui/IconoDegradado';
import { TarjetaGlass } from '../../src/core/ui/TarjetaGlass';
import { TextoDegradado } from '../../src/core/ui/TextoDegradado';

const LOGO = require('../../assets/logo-candela.png');
const HERO_ART = require('../../assets/hero-home.png');

/**
 * Diámetros del resplandor de esquina de cada tarjeta, de fuera hacia
 * dentro. Doce capas para que el círculo exterior no deje canto visible.
 */
const CAPAS_BRILLO = Array.from({ length: 12 }, (_, i) => 112 - i * 8);

/** Alto del hero con la letra en tamaño normal. Crece si el sistema la sube. */
const ALTO_HERO = 240;

/** Alto de las tarjetas del grid con la letra en tamaño normal. */
const ALTO_TARJETA = 216;

/**
 * Espacio reservado para el título y la descripción de cada tarjeta: dos
 * líneas siempre, ocupen una o dos. Es lo que iguala las cuatro tarjetas.
 * Los tres altos pasan por `altoSegunFuente`, porque si el texto crece con
 * los ajustes del sistema y la reserva no, el texto se sale.
 */
const ALTO_TITULO_TARJETA = 42;
const ALTO_DESC_TARJETA = 34;

export default function Home() {
  const insets = useSafeAreaInsets();

  return (
    <FondoPantalla>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          estilos.scroll,
          // Solo el inset superior. Abajo no hace falta reservar nada: la
          // barra de pestañas se maqueta DEBAJO de esta pantalla, ocupando
          // su propio espacio. Sumarle el alto de la barra dejaba un hueco
          // muerto del tamaño de la barra.
          { paddingTop: insets.top + espacio.sm },
        ]}
      >
        <Cabecera />
        <Hero />
        <Grid />
      </ScrollView>
    </FondoPantalla>
  );
}

// ── Cabecera ──────────────────────────────────────────────────────────────

function Cabecera() {
  return (
    <View style={estilos.cabecera}>
      <View style={estilos.marcoLogo}>
        <Image source={LOGO} style={estilos.logo} contentFit="contain" />
      </View>
      <View style={estilos.textosCabecera}>
        <Text style={estilos.nombreMarca}>Candela IA</Text>
        <Text style={estilos.lemaMarca}>Enciende el interés</Text>
      </View>
    </View>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────

/**
 * El prototipo fija la franja de arte en 172px y el título en 32px, medidas
 * pensadas para una pantalla ancha. En un celular angosto eso deja al texto
 * sin espacio y "oportunidad" se parte en dos.
 *
 * Ambos valores se calculan desde el ancho real: el arte ocupa el 44% del
 * hero (con tope de 172) y la tipografía baja en pantallas chicas.
 */
function medidasHero(anchoPantalla: number) {
  const anchoHero = anchoPantalla - espacio.lg * 2;

  return {
    anchoArte: Math.min(172, anchoHero * 0.44),
    tamanoTitulo: anchoPantalla < 380 ? 26 : 32,
    interlineado: anchoPantalla < 380 ? 29 : 35,
  };
}

/**
 * Capas del resplandor del hero, de fuera hacia dentro.
 *
 * El prototipo lo hace con dos `box-shadow` de color, uno rosa proyectado
 * hacia abajo y otro púrpura alrededor. En Android no hay sombra con color
 * —`elevation` solo pinta gris—, así que se reconstruye con marcos
 * concéntricos, la misma técnica que las auras del fondo.
 *
 * `abajo` desplaza cada capa para reproducir la caída del diseño: el halo
 * pesa más bajo la tarjeta que sobre ella.
 */
const CAPAS_HERO = [
  { crece: 18, abajo: 12, color: '168,85,247', opacidad: 0.05 },
  { crece: 13, abajo: 9, color: '255,45,138', opacidad: 0.05 },
  { crece: 8, abajo: 6, color: '255,45,138', opacidad: 0.06 },
  { crece: 4, abajo: 3, color: '255,45,138', opacidad: 0.07 },
];

function Hero() {
  const { width, fontScale } = useWindowDimensions();
  const { anchoArte, tamanoTitulo, interlineado } = medidasHero(width);

  return (
    <View style={estilos.marcoHero}>
      {CAPAS_HERO.map((capa) => (
        <View
          key={capa.crece}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -capa.crece + capa.abajo,
            bottom: -capa.crece - capa.abajo,
            left: -capa.crece,
            right: -capa.crece,
            borderRadius: 30 + capa.crece,
            backgroundColor: `rgba(${capa.color},${capa.opacidad})`,
          }}
        />
      ))}

      <View
        style={[
          estilos.hero,
          { minHeight: altoSegunFuente(ALTO_HERO, fontScale) },
        ]}
      >
      <LinearGradient
        colors={[
          colors.oscuro.violetaSuave,
          colors.oscuro.uvaSuave,
          colors.oscuro.magentaOscuro,
        ]}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ilustración pegada a la derecha, difuminada hacia el texto. */}
      <View style={[estilos.franjaArte, { width: anchoArte }]}>
        <Image
          source={HERO_ART}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={{ left: '58%', top: '28%' }}
        />
        <LinearGradient
          colors={[
            colors.oscuro.ciruela,
            'rgba(21,10,27,0.65)',
            'transparent',
          ]}
          locations={[0, 0.26, 0.62]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View
        style={[estilos.textoHero, { paddingRight: anchoArte - espacio.lg }]}
      >
        {HERO.titulo.map((linea) => (
          <Text
            key={linea}
            // El título es lo más grande de la pantalla y lo primero que se
            // desborda cuando el sistema sube la letra. Con el tope, crece
            // pero sigue cabiendo.
            maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
            style={[
              estilos.tituloHero,
              { fontSize: tamanoTitulo, lineHeight: interlineado },
            ]}
          >
            {linea}
          </Text>
        ))}
        <TextoDegradado
          estilo={{
            ...estilos.tituloHero,
            fontSize: tamanoTitulo,
            lineHeight: interlineado,
          }}
        >
          {HERO.destacado}
        </TextoDegradado>
        <Text
          style={estilos.descripcionHero}
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
        >
          {HERO.descripcion}
        </Text>
      </View>
      </View>
    </View>
  );
}

// ── Grid de funciones ─────────────────────────────────────────────────────

function Grid() {
  const { width, fontScale } = useWindowDimensions();
  // 20 de margen a cada lado + 16 entre columnas.
  const anchoTarjeta = (width - espacio.lg * 2 - espacio.base) / 2;

  return (
    <View style={estilos.grid}>
      {FUNCIONES.map((funcion) => (
        <TarjetaFuncion
          key={funcion.id}
          funcion={funcion}
          ancho={anchoTarjeta}
          fontScale={fontScale}
        />
      ))}
    </View>
  );
}

function TarjetaFuncion({
  funcion,
  ancho,
  fontScale,
}: {
  funcion: FuncionHome;
  ancho: number;
  fontScale: number;
}) {
  const router = useRouter();
  const t = TONOS[funcion.tono];

  return (
    <Pressable
      onPress={() => router.push(funcion.ruta)}
      accessibilityRole="button"
      accessibilityLabel={`${funcion.titulo}. ${funcion.descripcion}`}
      // Sin alto propio: la fila lo estira al de la tarjeta más alta, para
      // que "Analizar Stories" (título de dos líneas) no descuadre a su
      // compañera de fila.
      style={({ pressed }) => [{ width: ancho }, pressed && estilos.presionada]}
    >
      <TarjetaGlass
        tono={funcion.tono}
        estilo={[
          estilos.tarjeta,
          { minHeight: altoSegunFuente(ALTO_TARJETA, fontScale) },
        ]}
        padding={16}
      >
        {/* Resplandor de la esquina superior derecha.
            En el prototipo es un radial-gradient con blur; aquí se simula
            con círculos concéntricos de opacidad mínima.

            La clave está en el NÚMERO de capas, no en la opacidad de cada
            una: con cuatro círculos al 0.05 el filo del mayor seguía
            viéndose y la tarjeta mostraba un disco en vez de un halo. Con
            doce al 0.012 el borde exterior es invisible y la opacidad se
            acumula hacia el centro. Es la misma lección que ya estaba
            aprendida en `FondoPantalla`. */}
        <View pointerEvents="none" style={estilos.grupoBrillo}>
          {CAPAS_BRILLO.map((tamano) => (
            <View
              key={tamano}
              style={{
                position: 'absolute',
                width: tamano,
                height: tamano,
                borderRadius: tamano / 2,
                backgroundColor: `rgba(${t.rgb},0.012)`,
              }}
            />
          ))}
        </View>

        <IconoDegradado
          nombre={funcion.icono}
          tono={funcion.tono}
          tamano={44}
          radio={14}
        />

        {/* Título y descripción reservan SIEMPRE dos líneas, ocupen una o
            dos. Es lo que hace que las cuatro tarjetas midan igual y que la
            flecha caiga a la misma altura en todas: "Analizar Stories" pide
            dos líneas de título y "Crear notas" una, y sin reserva esa
            diferencia descuadraba la fila entera. */}
        <Text
          style={[
            estilos.tituloTarjeta,
            { minHeight: altoSegunFuente(ALTO_TITULO_TARJETA, fontScale) },
          ]}
          numberOfLines={2}
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
        >
          {funcion.titulo}
        </Text>
        <Text
          style={[
            estilos.descTarjeta,
            { minHeight: altoSegunFuente(ALTO_DESC_TARJETA, fontScale) },
          ]}
          numberOfLines={2}
          maxFontSizeMultiplier={MAX_ESCALA_FUENTE}
        >
          {funcion.descripcion}
        </Text>

        <View style={estilos.pieTarjeta}>
          <FlechaCircular tono={funcion.tono} />
        </View>
      </TarjetaGlass>
    </Pressable>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  scroll: { paddingBottom: espacio.base },

  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    paddingHorizontal: espacio.lg,
    paddingBottom: espacio.base,
  },
  marcoLogo: {
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,45,138,0.35)',
    backgroundColor: colors.oscuro.ciruelaSuave,
    ...Platform.select({
      ios: {
        shadowColor: colors.marca.rosa,
        shadowOpacity: 0.9,
        shadowRadius: 13,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 6 },
    }),
  },
  logo: { width: '100%', height: '100%' },
  textosCabecera: { flex: 1 },
  nombreMarca: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.marca.rosa,
  },
  lemaMarca: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.texto.blanco,
  },

  // Contenedor sin recorte: aquí viven las capas del resplandor, que tienen
  // que poder salirse del hero. El margen es el de la pantalla, así que el
  // halo llega justo al borde sin pasarse.
  marcoHero: { marginHorizontal: espacio.lg },
  hero: {
    // `minHeight` y no `height`: con la letra del sistema en grande, el
    // título necesita más alto del que el diseño reservó. Con alto fijo, el
    // texto se salía del recuadro y se cortaba por arriba. El alto concreto
    // lo calcula `Hero()` según el `fontScale` del momento.
    borderRadius: 30,
    overflow: 'hidden',
    // El filo que se ve en el diseño. Sin él, la tarjeta se funde con el
    // fondo y el resplandor no tiene contra qué contrastar.
    borderWidth: 1,
    borderColor: 'rgba(255,45,138,0.22)',
    ...Platform.select({
      // En iOS la sombra sí lleva color, así que ahí se usa la nativa y las
      // capas de arriba solo suman.
      ios: {
        shadowColor: colors.marca.rosa,
        shadowOpacity: 0.75,
        shadowRadius: 26,
        shadowOffset: { width: 0, height: 16 },
      },
    }),
  },
  franjaArte: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  textoHero: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: espacio.lg,
  },
  tituloHero: {
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.texto.blanco,
  },
  descripcionHero: {
    marginTop: espacio.md,
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.68)',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacio.base,
    paddingHorizontal: espacio.lg,
    marginTop: espacio.base,
    // Estira las tarjetas de cada fila al alto de la más alta.
    alignItems: 'stretch',
  },
  // El alto lo pone `TarjetaFuncion` con `altoSegunFuente`, porque depende
  // del tamaño de letra del sistema y eso no se sabe hasta el render.
  // `flex: 1` hace que la tarjeta llene el alto que la fila le asignó, así
  // las dos de cada fila terminan parejas.
  tarjeta: { flex: 1 },
  presionada: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  grupoBrillo: {
    position: 'absolute',
    right: -24,
    top: -16,
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloTarjeta: {
    marginTop: espacio.md,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '700',
    color: colors.texto.blanco,
  },
  descTarjeta: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.5)',
  },
  pieTarjeta: {
    marginTop: 'auto',
    alignItems: 'flex-end',
  },
});
