import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TonoPanelApi } from '../../../src/core/api/admin';
import { colors, espacio, radio, tipografia, TONOS } from '../../../src/core/theme';
import { CabeceraPantalla } from '../../../src/core/ui/CabeceraPantalla';
import { FondoPantalla } from '../../../src/core/ui/FondoPantalla';
import { TarjetaGlass } from '../../../src/core/ui/TarjetaGlass';
import { aspectoDe } from '../../../src/features/admin/aspecto';
import { usarPanel } from '../../../src/features/admin/usarPanel';

/**
 * ENTRENAR A LA IA → una sección: sus modos de respuesta.
 *
 * Cada modo dice si sigue con su instrucción original o si alguien la
 * cambió, para que se vea de un vistazo qué se ha tocado.
 */
export default function TonosDeSeccion() {
  const router = useRouter();
  const { funcion } = useLocalSearchParams<{ funcion: string }>();
  const panel = usarPanel();

  // Sin sesión (venció, o se entró aquí directo) se vuelve al candado.
  if (!panel.token) return <Redirect href="/entrenar-ia" />;

  const seccion = panel.data?.funciones.find((f) => f.id === funcion);
  const acento = aspectoDe(seccion?.id ?? 'ANALIZAR_CHAT').tono;

  return (
    <FondoPantalla>
      <CabeceraPantalla titulo={seccion?.etiqueta ?? 'Modos'} />

      <ScrollView contentContainerStyle={estilos.scroll}>
        {!seccion ? (
          <ActivityIndicator color={colors.marca.rosa} style={estilos.cargando} />
        ) : (
          <>
            <Text style={estilos.ayuda}>
              Toca un modo para ver y cambiar su instrucción.
            </Text>

            {seccion.tonos.map((tono) => (
              <FilaTono
                key={tono.id}
                tono={tono}
                onPress={() =>
                  router.push({
                    pathname: '/entrenar-ia/[funcion]/[tono]',
                    params: { funcion: seccion.id, tono: tono.id },
                  })
                }
              />
            ))}

            {seccion.id === 'ROMPEHIELOS' ? (
              <TarjetaGlass tono={acento} estilo={estilos.nota}>
                <Text style={estilos.textoNota}>
                  "Básico" no aparece porque no usa la IA: sale de un banco de
                  100 frases escritas a mano.
                </Text>
              </TarjetaGlass>
            ) : null}
          </>
        )}
      </ScrollView>
    </FondoPantalla>
  );
}

function FilaTono({ tono, onPress }: { tono: TonoPanelApi; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tono.etiqueta}. ${tono.editado ? 'Editado' : 'Original'}`}
      style={({ pressed }) => [estilos.fila, pressed && estilos.presionada]}
    >
      <View style={estilos.cuadroEmoji}>
        <Text style={estilos.emoji}>{tono.emoji}</Text>
      </View>

      <View style={estilos.textos}>
        <View style={estilos.filaTitulo}>
          <Text style={estilos.titulo} numberOfLines={1}>
            {tono.etiqueta}
          </Text>
          {tono.esPremium ? (
            <MaterialCommunityIcons name="crown" size={13} color={TONOS.ambar.from} />
          ) : null}
        </View>
        <Text style={estilos.resumen} numberOfLines={2}>
          {resumen(tono.instruccion)}
        </Text>
      </View>

      <View style={[estilos.insignia, tono.editado && estilos.insigniaEditada]}>
        <Text style={[estilos.textoInsignia, tono.editado && estilos.textoEditada]}>
          {tono.editado ? 'Editado' : 'Original'}
        </Text>
      </View>
    </Pressable>
  );
}

/** La primera línea de la instrucción, sin la etiqueta "QUÉ BUSCAS:". */
function resumen(instruccion: string): string {
  const primera = instruccion.split('\n').find((linea) => linea.trim()) ?? '';
  return primera.replace(/^[A-ZÁÉÍÓÚÑ ]+:\s*/, '');
}

const estilos = StyleSheet.create({
  scroll: { paddingHorizontal: espacio.lg, paddingBottom: espacio.xxl },
  cargando: { marginVertical: espacio.xl },
  ayuda: {
    ...tipografia.pequeno,
    color: colors.texto.suave,
    marginTop: espacio.sm,
    marginBottom: espacio.base,
  },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    padding: espacio.base,
    marginBottom: espacio.md,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  presionada: { opacity: 0.75 },
  cuadroEmoji: {
    width: 40,
    height: 40,
    borderRadius: radio.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  emoji: { fontSize: 20, lineHeight: 26 },
  textos: { flex: 1 },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titulo: { ...tipografia.cuerpoFuerte, color: colors.texto.blanco, flexShrink: 1 },
  resumen: {
    ...tipografia.pequeno,
    fontSize: 12,
    lineHeight: 16,
    color: colors.texto.tenue,
    marginTop: 2,
  },

  insignia: {
    paddingHorizontal: espacio.sm,
    paddingVertical: 3,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  insigniaEditada: {
    borderColor: 'rgba(255,45,138,0.5)',
    backgroundColor: 'rgba(255,45,138,0.12)',
  },
  textoInsignia: { ...tipografia.pequeno, fontSize: 11, color: colors.texto.tenue },
  textoEditada: { color: colors.marca.rosa, fontWeight: '600' },

  nota: { marginTop: espacio.sm },
  textoNota: { ...tipografia.pequeno, color: colors.texto.claro },
});
