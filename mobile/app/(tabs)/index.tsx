import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
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

import { usarArranque } from '../../src/core/di/arranque';
import {
  FUNCIONES,
  FuncionHome,
  HERO,
} from '../../src/features/home/funciones';
import { colors, espacio, tipografia, TONOS } from '../../src/core/theme';
import { FlechaCircular } from '../../src/core/ui/FlechaCircular';
import { FondoPantalla } from '../../src/core/ui/FondoPantalla';
import { IconoDegradado } from '../../src/core/ui/IconoDegradado';
import { TarjetaGlass } from '../../src/core/ui/TarjetaGlass';
import { TextoDegradado } from '../../src/core/ui/TextoDegradado';

const LOGO = require('../../assets/logo-candela.png');
const HERO_ART = require('../../assets/hero-home.png');

export default function Home() {
  const insets = useSafeAreaInsets();

  const cargado = usarArranque((estado) => estado.cargado);
  const onboardingVisto = usarArranque((estado) => estado.onboardingVisto);

  // El Home es la primera pantalla, así que aquí es donde se decide si el
  // usuario es nuevo. Mientras no se sepa no se pinta nada: el fondo del
  // splash es de este mismo negro, así que no se ve un hueco, y se evita el
  // parpadeo de mostrar el Home un instante antes de saltar al onboarding.
  if (!cargado) return null;

  // `Redirect` en vez de navegar desde un efecto: no deja entrada en el
  // historial, así que el gesto de "atrás" del onboarding no devuelve a un
  // Home que el usuario nunca pidió ver.
  if (!onboardingVisto) return <Redirect href="/onboarding" />;

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

function Hero() {
  const { width } = useWindowDimensions();
  const { anchoArte, tamanoTitulo, interlineado } = medidasHero(width);

  return (
    <View style={estilos.hero}>
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
        <Text style={estilos.descripcionHero}>{HERO.descripcion}</Text>
      </View>
    </View>
  );
}

// ── Grid de funciones ─────────────────────────────────────────────────────

function Grid() {
  const { width } = useWindowDimensions();
  // 20 de margen a cada lado + 16 entre columnas.
  const anchoTarjeta = (width - espacio.lg * 2 - espacio.base) / 2;

  return (
    <View style={estilos.grid}>
      {FUNCIONES.map((funcion) => (
        <TarjetaFuncion
          key={funcion.id}
          funcion={funcion}
          ancho={anchoTarjeta}
        />
      ))}
    </View>
  );
}

function TarjetaFuncion({
  funcion,
  ancho,
}: {
  funcion: FuncionHome;
  ancho: number;
}) {
  const router = useRouter();
  const t = TONOS[funcion.tono];

  return (
    <Pressable
      onPress={() => router.push(funcion.ruta as never)}
      accessibilityRole="button"
      accessibilityLabel={`${funcion.titulo}. ${funcion.descripcion}`}
      // Sin alto propio: la fila lo estira al de la tarjeta más alta, para
      // que "Analizar Stories" (título de dos líneas) no descuadre a su
      // compañera de fila.
      style={({ pressed }) => [{ width: ancho }, pressed && estilos.presionada]}
    >
      <TarjetaGlass tono={funcion.tono} estilo={estilos.tarjeta} padding={16}>
        {/* Resplandor de la esquina superior derecha.
            En el prototipo es un radial-gradient con blur; aquí se simula
            con círculos concéntricos de opacidad mínima, igual que las
            auras del fondo — un solo círculo dejaría un filo visible. */}
        <View pointerEvents="none" style={estilos.grupoBrillo}>
          {[112, 92, 72, 52].map((tamano) => (
            <View
              key={tamano}
              style={{
                position: 'absolute',
                width: tamano,
                height: tamano,
                borderRadius: tamano / 2,
                backgroundColor: `rgba(${t.rgb},0.05)`,
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

        <Text style={estilos.tituloTarjeta}>{funcion.titulo}</Text>
        <Text style={estilos.descTarjeta}>{funcion.descripcion}</Text>

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

  hero: {
    height: 240,
    marginHorizontal: espacio.lg,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.marca.rosa,
        shadowOpacity: 0.75,
        shadowRadius: 26,
        shadowOffset: { width: 0, height: 16 },
      },
      android: { elevation: 10 },
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
  // minHeight en vez de height fija: los títulos de dos líneas necesitan
  // más espacio. `flex: 1` hace que la tarjeta llene el alto que la fila
  // le asignó, así ambas terminan parejas.
  tarjeta: { minHeight: 188, flex: 1 },
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
