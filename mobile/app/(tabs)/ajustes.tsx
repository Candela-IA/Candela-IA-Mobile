import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppConfig } from '../../src/config/app_config';
import { usarArranque } from '../../src/core/di/arranque';
import { useSesion } from '../../src/core/di/sesion';
import { abrirEnlaceLegal, contactarSoporte } from '../../src/core/legal';
import { valorarApp } from '../../src/core/valoracion';
import { colors, espacio, radio, tipografia } from '../../src/core/theme';
import { FilaAjuste, SeparadorAjuste } from '../../src/core/ui/FilaAjuste';
import { FondoPantalla } from '../../src/core/ui/FondoPantalla';
import { Interruptor } from '../../src/core/ui/Interruptor';
import { TarjetaGlass } from '../../src/core/ui/TarjetaGlass';

const LOGO = require('../../assets/logo-candela.png');

/**
 * AJUSTES
 *
 * Sigue el orden del prototipo: primero lo que genera ingresos (Premium),
 * después lo que el usuario cambia a menudo, y al final lo legal y el
 * contacto.
 */
export default function Ajustes() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const esPremium = useSesion((estado) => estado.saldo?.esPremium ?? false);
  const haySesion = useSesion((estado) => estado.saldo !== null);
  const simularPremium = useSesion((estado) => estado.simularPremium);
  const olvidarOnboarding = usarArranque((estado) => estado.olvidarOnboarding);

  // De app.json, no de expo-application: dentro de Expo Go esa librería
  // devuelve la versión de Expo Go, no la de Candela.
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const pendiente = (que: string) =>
    Alert.alert('Todavía no está listo', `${que} se conecta más adelante.`);

  return (
    <FondoPantalla>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          estilos.scroll,
          { paddingTop: insets.top + espacio.base },
        ]}
      >
        <Text style={estilos.titulo}>Ajustes</Text>

        <TarjetaGlass tono="rosa" padding={0} estilo={estilos.tarjeta}>
          <FilaAjuste
            icono="sparkles"
            tono="rosa"
            titulo="Candela IA Premium"
            subtitulo="Desbloquea todo el poder de la IA"
            destacado
            onPress={() => router.push('/premium')}
          />
        </TarjetaGlass>

        {/*
          Interruptor de pruebas: enciende premium en memoria para poder
          revisar los tonos bloqueados sin pagar. Solo existe en desarrollo;
          en una build de producción este bloque no se dibuja, porque si
          llegara a la tienda cualquiera se saltaría el paywall.
        */}
        {AppConfig.esDesarrollo ? (
          <TarjetaGlass
            tono={esPremium ? 'ambar' : 'purpura'}
            padding={0}
            estilo={estilos.tarjeta}
          >
            <FilaAjuste
              icono={esPremium ? 'sparkles' : 'lock-closed'}
              tono={esPremium ? 'ambar' : 'purpura'}
              titulo="Paywall Premium (pruebas)"
              subtitulo={
                esPremium
                  ? 'Respuestas premium desbloqueadas'
                  : 'Opciones premium bloqueadas tras el paywall'
              }
              derecha={
                <Interruptor
                  valor={esPremium}
                  onCambiar={() => {
                    if (!haySesion) {
                      pendiente('El simulador necesita el backend corriendo, y');
                      return;
                    }
                    simularPremium(!esPremium);
                  }}
                  etiqueta="Simular suscripción premium"
                />
              }
            />
          </TarjetaGlass>
        ) : null}

        <TarjetaGlass tono="cian" padding={0} estilo={estilos.tarjeta}>
          <FilaAjuste
            icono="sparkles"
            tono="cian"
            titulo="Onboarding"
            subtitulo="Vuelve a ver el tutorial inicial"
            onPress={() => router.push('/onboarding')}
          />

          {/* Solo en desarrollo: la bienvenida se muestra una vez y ya, así
              que sin esto habría que borrar los datos de Expo Go cada vez
              que se quiera revisar el flujo de usuario nuevo. */}
          {AppConfig.esDesarrollo ? (
            <>
              <SeparadorAjuste />
              <FilaAjuste
                compacta
                icono="refresh"
                tono="azul"
                titulo="Reiniciar primer arranque (pruebas)"
                subtitulo="La próxima vez volverá a salir la bienvenida"
                onPress={() => {
                  olvidarOnboarding();
                  Alert.alert(
                    'Listo',
                    'Recarga la app y verás la bienvenida desde el principio.',
                  );
                }}
              />
            </>
          ) : null}
        </TarjetaGlass>

        <TarjetaGlass tono="purpura" padding={0} estilo={estilos.tarjeta}>
          <FilaAjuste
            compacta
            icono="mail"
            tono="azul"
            titulo="Contáctanos"
            subtitulo="Soporte y ayuda"
            onPress={() => void contactarSoporte()}
          />
          <SeparadorAjuste />
          <FilaAjuste
            compacta
            icono="chatbubble-ellipses"
            tono="cian"
            titulo="Tu opinión"
            subtitulo="Ayúdanos a mejorar"
            onPress={() => void valorarApp()}
          />
          <SeparadorAjuste />
          <FilaAjuste
            compacta
            icono="shield-checkmark"
            tono="purpura"
            titulo="Política de Privacidad"
            subtitulo="Cómo protegemos tus datos"
            onPress={() => abrirEnlaceLegal('privacidad')}
          />
          <SeparadorAjuste />
          <FilaAjuste
            compacta
            icono="document-text"
            tono="rosa"
            titulo="Términos de Uso"
            subtitulo="Condiciones de uso de la app"
            onPress={() => router.push('/terminos')}
          />
          <SeparadorAjuste />
          <FilaAjuste
            compacta
            icono="brush"
            tono="ambar"
            titulo="Personalización"
            subtitulo="Ajusta el estilo a tu gusto"
            onPress={() => router.push('/personalizacion')}
          />
        </TarjetaGlass>

        <TarjetaGlass tono="rosa" padding={espacio.lg} estilo={estilos.tarjeta}>
          <View style={estilos.filaVersion}>
            <View style={estilos.marcoLogo}>
              <Image source={LOGO} style={estilos.logo} contentFit="contain" />
            </View>
            <View style={estilos.textosVersion}>
              <Text style={estilos.nombreApp}>Candela IA</Text>
              <Text style={estilos.version}>Versión {version}</Text>
              <Text style={estilos.copyright}>
                © {new Date().getFullYear()} Candela IA. Todos los derechos
                reservados.
              </Text>
            </View>
          </View>
        </TarjetaGlass>
      </ScrollView>
    </FondoPantalla>
  );
}

const estilos = StyleSheet.create({
  scroll: { paddingHorizontal: espacio.lg, paddingBottom: espacio.xl },

  titulo: {
    ...tipografia.titulo,
    fontSize: 24,
    color: colors.texto.blanco,
    marginBottom: espacio.base,
  },
  tarjeta: { marginBottom: espacio.base },

  filaVersion: { flexDirection: 'row', alignItems: 'center', gap: espacio.base },
  marcoLogo: {
    width: 64,
    height: 64,
    borderRadius: radio.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oscuro.ciruelaSuave,
    borderWidth: 1,
    borderColor: 'rgba(255,45,138,0.35)',
  },
  logo: { width: '100%', height: '100%' },
  textosVersion: { flex: 1 },
  nombreApp: { ...tipografia.subtitulo, fontSize: 16, color: colors.texto.blanco },
  version: {
    ...tipografia.pequeno,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  copyright: {
    ...tipografia.pequeno,
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.25)',
    marginTop: 4,
  },
});
