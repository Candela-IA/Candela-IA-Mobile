import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usarArranque } from '../src/core/di/arranque';
import { PASOS, REGALO, SELLOS } from '../src/features/onboarding/pasos';
import {
  colors,
  espacio,
  radio,
  resplandor,
  tipografia,
  TONOS,
} from '../src/core/theme';
import { BotonDegradado } from '../src/core/ui/BotonDegradado';
import { FondoPantalla } from '../src/core/ui/FondoPantalla';
import { IconoDegradado } from '../src/core/ui/IconoDegradado';
import { IndicadorProgreso } from '../src/core/ui/IndicadorProgreso';
import { TarjetaGlass } from '../src/core/ui/TarjetaGlass';
import { TextoDegradado } from '../src/core/ui/TextoDegradado';

const LOGO = require('../assets/logo-candela.png');

/** Lado del bloque de hielo de la primera pantalla, según el diseño. */
const LADO_HIELO = 184;

/** Capas del halo helado, de fuera hacia dentro. */
const CAPAS_HIELO = [
  { crece: 22, opacidad: 0.04 },
  { crece: 15, opacidad: 0.05 },
  { crece: 9, opacidad: 0.06 },
  { crece: 4, opacidad: 0.07 },
];

/**
 * Onboarding de 5 pantallas.
 *
 * Un solo componente con estado interno en vez de cinco rutas: los pasos
 * comparten cabecera, indicador y botón, así que separarlos en rutas
 * distintas obligaría a repetir ese armazón cinco veces.
 */
export default function Onboarding() {
  const [indice, setIndice] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const marcarVisto = usarArranque((estado) => estado.marcarOnboardingVisto);

  const paso = PASOS[indice]!;
  const esUltimo = indice === PASOS.length - 1;

  const avanzar = () => {
    if (esUltimo) return terminar();
    setIndice((i) => i + 1);
  };

  const terminar = () => {
    marcarVisto();

    // Si se llegó desde Ajustes → "Onboarding", hay a dónde volver y se
    // vuelve ahí. Si vino del arranque, el `Redirect` no dejó historial y
    // toca reemplazar por el Home.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <FondoPantalla>
      <View style={[estilos.raiz, { paddingTop: insets.top + espacio.sm }]}>
        {/* ── Cabecera ─────────────────────────────────────────────── */}
        <View style={estilos.cabecera}>
          <View style={estilos.marca}>
            <Image source={LOGO} style={estilos.logoPequeno} contentFit="cover" />
            <TextoDegradado estilo={estilos.textoMarca}>
              Candela IA
            </TextoDegradado>
          </View>

          <IndicadorProgreso total={PASOS.length} actual={indice} />

          {paso.permiteOmitir ? (
            <Pressable
              onPress={terminar}
              hitSlop={12}
              accessibilityRole="button"
              style={estilos.omitir}
            >
              <Text style={estilos.textoOmitir}>Omitir</Text>
            </Pressable>
          ) : (
            // Espaciador: mantiene el indicador centrado en la pantalla 1,
            // que no tiene botón de omitir.
            <View style={estilos.omitirFantasma} />
          )}
        </View>

        {/* ── Contenido ────────────────────────────────────────────── */}
        <Animated.View
          key={indice}
          entering={FadeIn.duration(280)}
          exiting={FadeOut.duration(140)}
          style={estilos.cuerpo}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={estilos.scroll}
          >
            {paso.marcaCentral ? <MarcaCentral /> : null}

            <Titulo
              lineas={paso.titulo}
              enLinea={paso.tituloEnLinea}
              centrado={paso.centrado}
            />

            {paso.descripcion && !paso.emoji ? (
              <Text
                style={[
                  estilos.descripcionArriba,
                  paso.centrado && estilos.centrado,
                ]}
              >
                {paso.descripcion}
              </Text>
            ) : null}

            {paso.emoji ? <TarjetaEmoji emoji={paso.emoji} /> : null}
            {paso.logoCentral && !paso.lista ? <LogoCentral /> : null}

            {esUltimo ? <TarjetaRegalo /> : null}

            {paso.lista ? (
              <View style={paso.listaPlana ? undefined : estilos.lista}>
                {paso.lista.map((item, posicion, todos) =>
                  paso.listaPlana ? (
                    <View key={item.titulo}>
                      <View style={[estilos.filaItem, estilos.filaPlana]}>
                        <IconoDegradado
                          nombre={item.icono}
                          tono={item.tono}
                          tamano={44}
                          radio={14}
                        />
                        <View style={estilos.textosItem}>
                          <Text style={estilos.tituloItem}>{item.titulo}</Text>
                          <Text style={estilos.descItem}>
                            {item.descripcion}
                          </Text>
                        </View>
                      </View>
                      {posicion < todos.length - 1 ? (
                        <View style={estilos.hilo} />
                      ) : null}
                    </View>
                  ) : (
                    <TarjetaGlass
                      key={item.titulo}
                      tono={item.tono}
                      estilo={estilos.itemLista}
                    >
                      <View style={estilos.filaItem}>
                        {/* 56 en las tarjetas del "cómo funciona": son el
                            contenido principal de esa pantalla. */}
                        <IconoDegradado
                          nombre={item.icono}
                          tono={item.tono}
                          tamano={56}
                          radio={18}
                        />
                        <View style={estilos.textosItem}>
                          <Text style={estilos.tituloItem}>{item.titulo}</Text>
                          <Text style={estilos.descItem}>
                            {item.descripcion}
                          </Text>
                        </View>
                      </View>
                    </TarjetaGlass>
                  ),
                )}
              </View>
            ) : null}

            {paso.descripcion && paso.emoji ? (
              <Text style={estilos.descripcionAbajo}>{paso.descripcion}</Text>
            ) : null}

            {paso.notaAlPie ? (
              <Text style={estilos.notaAlPie}>{paso.notaAlPie}</Text>
            ) : null}
          </ScrollView>
        </Animated.View>

        {/* ── Acción ───────────────────────────────────────────────── */}
        <View style={[estilos.pie, { paddingBottom: insets.bottom + espacio.base }]}>
          <BotonDegradado
            titulo={paso.textoBoton}
            onPress={avanzar}
            iconoDerecha={
              <Ionicons
                name={esUltimo ? 'flame' : 'arrow-forward'}
                size={18}
                color={colors.texto.blanco}
              />
            }
          />

          {esUltimo ? (
            <>
              <Text style={estilos.pieRegalo}>
                Empieza con{' '}
                <Text style={estilos.pieRegaloFuerte}>5 intentos gratis</Text>
              </Text>
              <View style={estilos.sellos}>
                {SELLOS.map((sello) => (
                  <View key={sello.texto} style={estilos.sello}>
                    <Ionicons
                      name={sello.icono}
                      size={11}
                      color={colors.texto.tenue}
                    />
                    <Text style={estilos.textoSello}>{sello.texto}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>
      </View>
    </FondoPantalla>
  );
}

// ── Piezas ────────────────────────────────────────────────────────────────

function Titulo({
  lineas,
  enLinea = false,
  centrado = false,
}: {
  lineas: { texto: string; destacar?: boolean }[];
  enLinea?: boolean;
  centrado?: boolean;
}) {
  // Un solo párrafo con lo destacado en rosa dentro de la frase. El
  // degradado no sirve aquí: se pinta enmascarando el texto y eso solo
  // funciona en bloque, no en mitad de una línea.
  if (enLinea) {
    return (
      <Text
        style={[
          estilos.textoTitulo,
          estilos.tituloCompacto,
          centrado && estilos.centrado,
        ]}
      >
        {lineas.map((linea) =>
          linea.destacar ? (
            <Text key={linea.texto} style={estilos.destacadoRosa}>
              {linea.texto}
            </Text>
          ) : (
            linea.texto
          ),
        )}
      </Text>
    );
  }

  return (
    <View style={[estilos.titulo, centrado && estilos.centrado]}>
      {lineas.map((linea) =>
        linea.destacar ? (
          <TextoDegradado key={linea.texto} estilo={estilos.textoTitulo}>
            {linea.texto}
          </TextoDegradado>
        ) : (
          <Text key={linea.texto} style={estilos.textoTitulo}>
            {linea.texto}
          </Text>
        ),
      )}
    </View>
  );
}

/**
 * El bloque de hielo de la primera pantalla.
 *
 * No es una tarjeta cualquiera con un emoji dentro: en el diseño es hielo
 * —borde blanco azulado, tinte cian, escarcha en el canto superior y un
 * halo helado—, y eso es lo que hace que la pantalla ilustre "tu chat se
 * enfría" en vez de solo decirlo.
 */
function TarjetaEmoji({ emoji }: { emoji: string }) {
  const cian = TONOS.cian.rgb;

  return (
    <View style={estilos.centro}>
      {/* El halo helado. En Android no hay sombra de color, así que va con
          marcos concéntricos como el resto de resplandores de la app. */}
      {CAPAS_HIELO.map((capa) => (
        <View
          key={capa.crece}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: LADO_HIELO + capa.crece * 2,
            height: LADO_HIELO + capa.crece * 2,
            borderRadius: 40 + capa.crece,
            backgroundColor: `rgba(${cian},${capa.opacidad})`,
          }}
        />
      ))}

      <View style={estilos.bloqueHielo}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.22)',
            `rgba(${cian},0.12)`,
            'rgba(17,17,24,0.9)',
          ]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Escarcha: el brillo que cae desde el canto superior. */}
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'transparent']}
          style={estilos.escarcha}
          pointerEvents="none"
        />

        <Text style={estilos.emoji}>{emoji}</Text>
      </View>
    </View>
  );
}

/**
 * Cierre de la bienvenida: el logo con el nombre debajo.
 *
 * Más pequeño que `LogoCentral` a propósito: aquí abajo vienen la tarjeta
 * de los intentos gratis y cuatro beneficios, y un logo enorme los
 * empujaría fuera de la pantalla.
 */
function MarcaCentral() {
  return (
    <View style={estilos.marcaCentral}>
      <Image source={LOGO} style={estilos.logoMarca} contentFit="cover" />
      <TextoDegradado estilo={estilos.nombreMarca}>Candela IA</TextoDegradado>
    </View>
  );
}

function LogoCentral() {
  return (
    <View style={estilos.centro}>
      <View style={[estilos.marcoLogo, resplandor(colors.marca.rosa, 0.55)]}>
        <Image source={LOGO} style={estilos.logoGrande} contentFit="cover" />
      </View>
    </View>
  );
}

/**
 * La tarjeta de los 5 intentos gratis.
 *
 * El regalo va como icono suelto con resplandor, no dentro del cuadrado
 * degradado que usan los beneficios: es la pieza que tiene que destacar de
 * la pantalla, y compartir forma con las demás la volvería una más.
 */
function TarjetaRegalo() {
  return (
    <TarjetaGlass tono="rosa" activa estilo={estilos.regalo}>
      <View style={estilos.filaItem}>
        <Ionicons
          name="gift"
          size={44}
          color={colors.marca.rosa}
          style={resplandor(colors.marca.rosa, 0.9)}
        />
        <View style={estilos.textosItem}>
          <Text style={estilos.tituloItem}>{REGALO.titulo}</Text>
          <Text style={estilos.descItem}>{REGALO.descripcion}</Text>
        </View>
      </View>
    </TarjetaGlass>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  raiz: { flex: 1, paddingHorizontal: espacio.lg },

  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.sm,
    marginBottom: espacio.xl,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
  logoPequeno: { width: 28, height: 28, borderRadius: radio.sm },
  textoMarca: { ...tipografia.cuerpoFuerte },
  omitir: {
    paddingHorizontal: espacio.md,
    paddingVertical: 6,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  omitirFantasma: { width: 62 },
  textoOmitir: { ...tipografia.pequeno, color: colors.texto.medio },

  cuerpo: { flex: 1 },
  scroll: { paddingBottom: espacio.lg },

  titulo: { marginBottom: espacio.base },
  tituloCompacto: { fontSize: 26, lineHeight: 32, marginBottom: espacio.base },
  centrado: { textAlign: 'center', alignItems: 'center' },
  destacadoRosa: { color: colors.marca.rosa },

  marcaCentral: { alignItems: 'center', gap: espacio.sm, marginBottom: espacio.md },
  logoMarca: { width: 74, height: 74, borderRadius: radio.xl },
  nombreMarca: { ...tipografia.titulo, fontSize: 30 },

  filaPlana: { paddingVertical: espacio.md },
  hilo: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  textoTitulo: { ...tipografia.titulo, color: colors.texto.blanco },

  descripcionArriba: {
    ...tipografia.cuerpo,
    color: colors.texto.suave,
    marginBottom: espacio.xl,
  },
  descripcionAbajo: {
    ...tipografia.cuerpo,
    color: colors.texto.suave,
    textAlign: 'center',
    marginTop: espacio.xl,
  },
  notaAlPie: {
    ...tipografia.pequeno,
    color: colors.texto.tenue,
    textAlign: 'center',
    marginTop: espacio.md,
  },

  centro: { alignItems: 'center', marginVertical: espacio.xxl },
  bloqueHielo: {
    width: LADO_HIELO,
    height: LADO_HIELO,
    borderRadius: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // Blanco azulado, no gris: es lo que lo hace leer como hielo y no como
    // una tarjeta más.
    borderWidth: 1,
    borderColor: 'rgba(190,240,255,0.5)',
  },
  escarcha: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 72,
  },
  emoji: { fontSize: 104, lineHeight: 124 },
  marcoLogo: { borderRadius: radio.xxl + 8 },
  logoGrande: { width: 168, height: 168, borderRadius: radio.xxl + 8 },

  lista: { gap: espacio.md, marginTop: espacio.sm },
  itemLista: {},
  regalo: { marginBottom: espacio.md },
  filaItem: { flexDirection: 'row', alignItems: 'center', gap: espacio.md },
  textosItem: { flex: 1 },
  tituloItem: {
    ...tipografia.cuerpoFuerte,
    color: colors.texto.blanco,
    marginBottom: 2,
  },
  descItem: { ...tipografia.pequeno, color: colors.texto.suave },

  pie: { paddingTop: espacio.base, gap: espacio.md },
  pieRegalo: {
    ...tipografia.pequeno,
    color: colors.texto.suave,
    textAlign: 'center',
  },
  pieRegaloFuerte: { color: colors.marca.rosa, fontWeight: '700' },
  sellos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: espacio.base,
  },
  sello: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textoSello: { ...tipografia.pequeno, fontSize: 11, color: colors.texto.tenue },
});
