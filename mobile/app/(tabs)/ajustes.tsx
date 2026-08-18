import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, espacio, tipografia } from '../../src/core/theme';
import { FondoPantalla } from '../../src/core/ui/FondoPantalla';
import { IconoDegradado } from '../../src/core/ui/IconoDegradado';
import { TarjetaGlass } from '../../src/core/ui/TarjetaGlass';

/**
 * Ajustes — pendiente.
 *
 * Existe para que la pestaña funcione mientras construimos el Home. Su
 * contenido real (Onboarding, Contáctanos, Personalización...) va después.
 *
 * La fila de Premium sí es definitiva: el paywall tiene que poder abrirse
 * sin agotar antes los cinco créditos gratis.
 */
export default function Ajustes() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <FondoPantalla>
      <ScrollView
        contentContainerStyle={[
          estilos.scroll,
          { paddingTop: insets.top + espacio.xl },
        ]}
      >
        <Text style={estilos.titulo}>Ajustes</Text>

        <TarjetaGlass
          tono="ambar"
          activa
          onPress={() => router.push('/premium')}
          estilo={estilos.premium}
        >
          <View style={estilos.filaPremium}>
            <IconoDegradado nombre="diamond" tono="ambar" />
            <View style={estilos.textosPremium}>
              <Text style={estilos.tituloPremium}>Candela Premium</Text>
              <Text style={estilos.descPremium}>
                Respuestas ilimitadas y todos los modos.
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.texto.tenue}
            />
          </View>
        </TarjetaGlass>

        <View style={estilos.aviso}>
          <Text style={estilos.textoAviso}>
            El resto de esta pantalla se construye después del Home y las
            cuatro funciones.
          </Text>
        </View>
      </ScrollView>
    </FondoPantalla>
  );
}

const estilos = StyleSheet.create({
  scroll: { paddingHorizontal: espacio.lg },
  titulo: {
    ...tipografia.titulo,
    color: colors.texto.blanco,
    marginBottom: espacio.xl,
  },
  premium: { marginBottom: espacio.lg },
  filaPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
  },
  textosPremium: { flex: 1 },
  tituloPremium: {
    ...tipografia.cuerpoFuerte,
    color: colors.texto.blanco,
    marginBottom: 2,
  },
  descPremium: { ...tipografia.pequeno, color: colors.texto.suave },

  aviso: {
    padding: espacio.base,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: colors.tarjeta,
  },
  textoAviso: { ...tipografia.cuerpo, color: colors.texto.suave },
});
