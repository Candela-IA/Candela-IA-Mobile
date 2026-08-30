import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSesion } from '../src/core/di/sesion';
import {
  colors,
  espacio,
  radio,
  tipografia,
  TONOS,
} from '../src/core/theme';
import { BotonDegradado } from '../src/core/ui/BotonDegradado';
import { FondoPantalla } from '../src/core/ui/FondoPantalla';
import { TarjetaGlass } from '../src/core/ui/TarjetaGlass';
import { TextoDegradado } from '../src/core/ui/TextoDegradado';
import { TarjetaPlan } from '../src/features/premium/TarjetaPlan';
import {
  DIAS_DE_PRUEBA,
  IdPlan,
  IconoVentaja,
  PLAN_POR_DEFECTO,
  PLANES,
  VENTAJAS,
} from '../src/features/premium/planes';
import { usarCompra } from '../src/features/premium/usarCompra';

const LOGO = require('../assets/logo-candela.png');

/**
 * PAYWALL
 *
 * Se abre al agotar los 5 créditos gratis (`usarGeneracion` la empuja al
 * recibir un 402) y desde Ajustes.
 *
 * El botón de compra va fijo abajo en vez de dentro del scroll: el contenido
 * no cabe en una pantalla y, si la acción viajara con él, alguien que no
 * desliza hasta el final nunca la vería.
 */
export default function Premium() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const esPremium = useSesion((estado) => estado.saldo?.esPremium ?? false);
  const { comprar, restaurar, abrirLegal, procesando } = usarCompra();

  const [seleccion, setSeleccion] = useState<IdPlan>(PLAN_POR_DEFECTO);
  // El pie es flotante, así que el scroll necesita saber cuánto mide para
  // reservar ese hueco al final. Se mide en vez de estimarse porque cambia
  // con el alto de la barra del sistema de cada teléfono.
  const [altoPie, setAltoPie] = useState(0);

  const cerrar = () => {
    // Si se llegó por navegación, volver. Si se abrió como primera pantalla
    // (por ejemplo desde una notificación), `back()` no tendría a dónde ir.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const medirPie = (evento: LayoutChangeEvent) => {
    setAltoPie(evento.nativeEvent.layout.height);
  };

  return (
    <FondoPantalla>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          estilos.scroll,
          {
            paddingTop: insets.top + espacio.md,
            paddingBottom: altoPie + espacio.lg,
          },
        ]}
      >
        {/* ── Cabecera ─────────────────────────────────────────────── */}
        <View style={estilos.cabecera}>
          <View style={estilos.izquierda}>
            <Pressable
              onPress={cerrar}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              style={({ pressed }) => [
                estilos.cerrar,
                pressed && estilos.presionado,
              ]}
            >
              <Ionicons name="close" size={18} color={colors.texto.claro} />
            </Pressable>

            <TextoDegradado estilo={estilos.marca}>Candela IA</TextoDegradado>
          </View>

          <Image source={LOGO} style={estilos.logo} contentFit="cover" />
        </View>

        <View style={estilos.pildoraGancho}>
          <Text style={estilos.textoGancho}>Enciende el interés 🔥</Text>
        </View>

        <Text style={estilos.titular}>
          Desbloquea todo el poder de la IA y consigue{' '}
          <Text style={estilos.titularDestacado}>más citas.</Text>
        </Text>

        {/* ── Rejilla de ventajas ──────────────────────────────────── */}
        <TarjetaGlass tono="purpura" padding={espacio.base} estilo={estilos.rejilla}>
          <View style={estilos.filaVentajas}>
            {VENTAJAS.map((ventaja) => (
              <View key={ventaja.texto} style={estilos.ventaja}>
                <IconoVentajaVista
                  icono={ventaja.icono}
                  color={TONOS[ventaja.tono].hex}
                />
                <Text style={estilos.textoVentaja}>{ventaja.texto}</Text>
              </View>
            ))}
          </View>
        </TarjetaGlass>

        {/* ── Planes ───────────────────────────────────────────────── */}
        {PLANES.map((plan) => (
          <TarjetaPlan
            key={plan.id}
            plan={plan}
            seleccionado={seleccion === plan.id}
            onSeleccionar={() => setSeleccion(plan.id)}
          />
        ))}

        {/* ── Confianza ────────────────────────────────────────────── */}
        <TarjetaGlass
          tono="purpura"
          intensidad={0.12}
          padding={espacio.base}
          estilo={estilos.seguridad}
        >
          <View style={estilos.filaSeguridad}>
            <View style={estilos.escudo}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.marca.purpura}
              />
            </View>
            <View style={estilos.textosSeguridad}>
              <TextoDegradado estilo={estilos.tituloSeguridad}>
                Compra 100% segura
              </TextoDegradado>
              <Text style={estilos.descSeguridad}>
                Tus datos están protegidos y tu privacidad es nuestra
                prioridad.
              </Text>
            </View>
          </View>
        </TarjetaGlass>

        {/* ── Enlaces obligatorios de las tiendas ──────────────────── */}
        <View style={estilos.legales}>
          <Enlace texto="Restaurar compras" onPress={restaurar} />
          <Text style={estilos.separador}>·</Text>
          <Enlace texto="Términos" onPress={() => abrirLegal('terminos')} />
          <Text style={estilos.separador}>·</Text>
          <Enlace texto="Privacidad" onPress={() => abrirLegal('privacidad')} />
        </View>
      </ScrollView>

      {/* ── Pie fijo ───────────────────────────────────────────────── */}
      <View
        style={[estilos.pie, { paddingBottom: insets.bottom + espacio.md }]}
        onLayout={medirPie}
      >
        {/* Difuminado que funde el contenido con el pie al desplazarse: sin
            él, el texto pasa por detrás del botón con el canto duro. */}
        <LinearGradient
          colors={['rgba(9,9,11,0)', 'rgba(9,9,11,0.96)']}
          style={estilos.difuminado}
          pointerEvents="none"
        />

        <BotonDegradado
          titulo={esPremium ? 'Ya tienes Premium' : 'Comenzar ahora'}
          subtitulo={
            esPremium
              ? 'Tu suscripción está activa'
              : 'Desbloquea todo el poder de Candela IA'
          }
          deshabilitado={esPremium}
          cargando={procesando}
          onPress={() => comprar(seleccion)}
          iconoIzquierda={
            esPremium ? null : (
              <Ionicons
                name="lock-open"
                size={17}
                color={colors.texto.blanco}
              />
            )
          }
        />

        <Text style={estilos.prueba}>
          <Text style={estilos.pruebaFuerte}>
            ✨ {DIAS_DE_PRUEBA} días gratis
          </Text>{' '}
          en ambos planes
        </Text>
        <Text style={estilos.legal}>
          Cancela cuando quieras. Sin compromisos.
        </Text>
      </View>
    </FondoPantalla>
  );
}

// ── Piezas ────────────────────────────────────────────────────────────────

function IconoVentajaVista({
  icono,
  color,
}: {
  icono: IconoVentaja;
  color: string;
}) {
  if (icono.familia === 'material') {
    return <MaterialCommunityIcons name={icono.nombre} size={22} color={color} />;
  }

  return <Ionicons name={icono.nombre} size={22} color={color} />;
}

function Enlace({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="link"
      style={({ pressed }) => (pressed ? estilos.presionado : undefined)}
    >
      <Text style={estilos.textoEnlace}>{texto}</Text>
    </Pressable>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  scroll: { paddingHorizontal: espacio.lg },

  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.base,
  },
  izquierda: { flex: 1, gap: espacio.md, alignItems: 'flex-start' },
  cerrar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.borde,
  },
  presionado: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  marca: { ...tipografia.display },
  logo: {
    width: 68,
    height: 68,
    borderRadius: radio.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.marca.rosa,
        shadowOpacity: 0.7,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 8 },
    }),
  },

  pildoraGancho: {
    alignSelf: 'flex-start',
    marginTop: espacio.base,
    paddingHorizontal: espacio.base,
    paddingVertical: 7,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  textoGancho: { ...tipografia.pequeno, color: colors.texto.claro },

  titular: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.texto.blanco,
    marginTop: espacio.lg,
  },
  titularDestacado: { color: colors.marca.rosa },

  rejilla: { marginTop: espacio.xl },
  filaVentajas: { flexDirection: 'row', gap: espacio.sm },
  ventaja: { flex: 1, alignItems: 'center', gap: espacio.sm },
  textoVentaja: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    color: colors.texto.medio,
    textAlign: 'center',
  },

  seguridad: { marginTop: espacio.lg },
  filaSeguridad: { flexDirection: 'row', alignItems: 'center', gap: espacio.md },
  escudo: {
    width: 36,
    height: 36,
    borderRadius: radio.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168,85,247,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  textosSeguridad: { flex: 1 },
  tituloSeguridad: { ...tipografia.cuerpoFuerte },
  descSeguridad: {
    ...tipografia.pequeno,
    fontSize: 12,
    color: colors.texto.suave,
    marginTop: 2,
  },

  legales: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.sm,
    marginTop: espacio.lg,
  },
  textoEnlace: {
    ...tipografia.pequeno,
    fontSize: 12,
    color: colors.texto.tenue,
    textDecorationLine: 'underline',
  },
  separador: { ...tipografia.pequeno, fontSize: 12, color: colors.texto.tenue },

  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: espacio.lg,
    paddingTop: espacio.lg,
    gap: espacio.sm,
    backgroundColor: 'rgba(9,9,11,0.96)',
  },
  difuminado: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -espacio.xxl,
    height: espacio.xxl,
  },
  prueba: {
    ...tipografia.pequeno,
    color: colors.texto.suave,
    textAlign: 'center',
    marginTop: espacio.xs,
  },
  pruebaFuerte: { color: colors.marca.rosa, fontWeight: '700' },
  legal: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: colors.texto.tenue,
    textAlign: 'center',
  },
});
