import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FuncionPanelApi,
  guardarPrompt,
  probarPrompt,
  PruebaApi,
  restaurarPrompt,
  TonoPanelApi,
} from '../../../src/core/api/admin';
import { FuncionApi } from '../../../src/core/api/candela';
import { ErrorApi } from '../../../src/core/api/cliente';
import { colors, espacio, radio, tipografia } from '../../../src/core/theme';
import { mostrarAviso } from '../../../src/core/ui/Aviso';
import { BotonDegradado } from '../../../src/core/ui/BotonDegradado';
import { BotonFantasma } from '../../../src/core/ui/BotonFantasma';
import { CabeceraPantalla } from '../../../src/core/ui/CabeceraPantalla';
import { EtiquetaSeccion } from '../../../src/core/ui/EtiquetaSeccion';
import { FondoPantalla } from '../../../src/core/ui/FondoPantalla';
import { TarjetaGlass } from '../../../src/core/ui/TarjetaGlass';
import { aspectoDe } from '../../../src/features/admin/aspecto';
import {
  cerrarSiVencio,
  usarActualizarPanel,
  usarPanel,
} from '../../../src/features/admin/usarPanel';
import {
  CapturaSeleccionada,
  ZonaCaptura,
} from '../../../src/features/generacion/ZonaCaptura';

/**
 * ENTRENAR A LA IA → una sección → un modo: el editor.
 *
 * Se escribe la instrucción, se prueba con una respuesta real y, si gusta,
 * se guarda. "Restaurar original" deshace cualquier cambio.
 */
export default function EditorDePrompt() {
  const { funcion, tono } = useLocalSearchParams<{ funcion: string; tono: string }>();
  const panel = usarPanel();

  if (!panel.token) return <Redirect href="/entrenar-ia" />;

  const seccion = panel.data?.funciones.find((f) => f.id === funcion);
  const elegido = seccion?.tonos.find((t) => t.id === tono);

  if (!seccion || !elegido) {
    return (
      <FondoPantalla>
        <CabeceraPantalla titulo="Modo" />
        <ActivityIndicator color={colors.marca.rosa} style={estilos.cargando} />
      </FondoPantalla>
    );
  }

  return (
    <Editor
      // Al guardar o restaurar cambia `actualizadoEn`, y el editor arranca
      // de nuevo con lo que quedó en el servidor en vez de con el borrador.
      key={`${seccion.id}/${elegido.id}/${elegido.actualizadoEn ?? 'original'}`}
      token={panel.token}
      seccion={seccion}
      tono={elegido}
      funciones={panel.data!.funciones}
      largoMinimo={panel.data!.largoMinimo}
      largoMaximo={panel.data!.largoMaximo}
    />
  );
}

function Editor({
  token,
  seccion,
  tono,
  funciones,
  largoMinimo,
  largoMaximo,
}: {
  token: string;
  seccion: FuncionPanelApi;
  tono: TonoPanelApi;
  funciones: FuncionPanelApi[];
  largoMinimo: number;
  largoMaximo: number;
}) {
  const insets = useSafeAreaInsets();
  const actualizarPanel = usarActualizarPanel();
  const acento = aspectoDe(seccion.id).tono;

  const [texto, setTexto] = useState(tono.instruccion);
  const [tambien, setTambien] = useState<FuncionApi[]>([]);
  const [captura, setCaptura] = useState<CapturaSeleccionada | null>(null);
  const [contexto, setContexto] = useState('');

  const [prueba, setPrueba] = useState<PruebaApi | null>(null);
  const [probando, setProbando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const largo = texto.trim().length;
  const largoValido = largo >= largoMinimo && largo <= largoMaximo;
  const cambiado = texto.trim() !== tono.instruccion.trim();
  const puedeGuardar = largoValido && (cambiado || tambien.length > 0) && !guardando;
  const faltaCaptura = seccion.requiereImagen && !captura;

  const nombreDe = (id: FuncionApi) =>
    funciones.find((f) => f.id === id)?.etiqueta ?? id;

  const fallo = (titulo: string, e: unknown) => {
    if (cerrarSiVencio(e)) {
      mostrarAviso('Sesión vencida', 'Vuelve a escribir la contraseña del panel.');
      return;
    }
    mostrarAviso(
      titulo,
      e instanceof ErrorApi ? e.message : 'Intenta de nuevo en un momento.',
    );
  };

  const probar = async () => {
    if (!largoValido || faltaCaptura || probando) return;
    setProbando(true);
    setPrueba(null);
    try {
      setPrueba(
        await probarPrompt(token, seccion.id, tono.id, {
          instruccion: texto,
          imagen: captura
            ? { base64: captura.base64, mimeType: captura.mimeType }
            : undefined,
          contexto: seccion.aceptaContexto ? contexto.trim() || undefined : undefined,
        }),
      );
    } catch (e) {
      fallo('No se pudo probar', e);
    } finally {
      setProbando(false);
    }
  };

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    try {
      actualizarPanel(
        await guardarPrompt(token, seccion.id, tono.id, {
          instruccion: texto,
          aplicarTambienA: tambien,
        }),
      );
      mostrarAviso(
        'Guardado',
        tambien.length > 0
          ? `"${tono.etiqueta}" ya responde así en ${[seccion.id, ...tambien].map(nombreDe).join(', ')}.`
          : `"${tono.etiqueta}" ya responde así en ${seccion.etiqueta}.`,
        'cian',
      );
    } catch (e) {
      fallo('No se pudo guardar', e);
    } finally {
      setGuardando(false);
    }
  };

  const restaurar = () => {
    Alert.alert(
      'Restaurar original',
      `"${tono.etiqueta}" volverá a responder como al principio en ${seccion.etiqueta}. Lo que escribiste se pierde.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            try {
              actualizarPanel(await restaurarPrompt(token, seccion.id, tono.id));
              mostrarAviso('Restaurado', `"${tono.etiqueta}" vuelve a su instrucción original.`, 'cian');
            } catch (e) {
              fallo('No se pudo restaurar', e);
            }
          },
        },
      ],
    );
  };

  return (
    <FondoPantalla>
      <CabeceraPantalla titulo={`${tono.emoji} ${tono.etiqueta}`} />

      <KeyboardAvoidingView
        style={estilos.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={estilos.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TarjetaGlass tono={acento} estilo={estilos.aviso}>
            <Text style={estilos.textoAviso}>
              Cambia cómo responde <Text style={estilos.fuerte}>{tono.etiqueta}</Text> en{' '}
              <Text style={estilos.fuerte}>{seccion.etiqueta}</Text>, para todos los
              usuarios. Pruébalo antes de guardar.
            </Text>
            <Text style={estilos.estado}>
              {tono.editado && tono.actualizadoEn
                ? `Editado el ${formatearFecha(tono.actualizadoEn)}`
                : 'Instrucción original'}
            </Text>
          </TarjetaGlass>

          <EtiquetaSeccion icono="create" tono="purpura">
            Instrucción para la IA
          </EtiquetaSeccion>
          <TextInput
            value={texto}
            onChangeText={(nuevo) => {
              setTexto(nuevo);
              setPrueba(null);
            }}
            multiline
            maxLength={largoMaximo}
            placeholder="Describe qué buscas, cómo suena, qué nunca debe hacer y un ejemplo."
            placeholderTextColor={colors.texto.tenue}
            style={estilos.editor}
            textAlignVertical="top"
          />
          <Text style={[estilos.contador, !largoValido && estilos.contadorMal]}>
            {largo < largoMinimo
              ? `Mínimo ${largoMinimo} caracteres`
              : `${largo}/${largoMaximo}`}
          </Text>

          <EtiquetaSeccion icono="flask" tono="cian">
            Probar antes de guardar
          </EtiquetaSeccion>

          {seccion.requiereImagen ? (
            <View style={estilos.bloque}>
              <ZonaCaptura
                captura={captura}
                onCambio={(nueva) => {
                  setCaptura(nueva);
                  setPrueba(null);
                }}
                vertical={seccion.id === 'ANALIZAR_STORIES'}
                tono={acento}
                subtextoVacio="Sube una captura de ejemplo para la prueba"
              />
            </View>
          ) : null}

          {seccion.aceptaContexto ? (
            <TextInput
              value={contexto}
              onChangeText={setContexto}
              placeholder="Contexto opcional, como lo escribiría un usuario"
              placeholderTextColor={colors.texto.tenue}
              maxLength={500}
              style={[estilos.campo, estilos.bloque]}
            />
          ) : null}

          <BotonFantasma
            titulo={
              probando
                ? 'Generando respuesta de prueba…'
                : faltaCaptura
                  ? 'Sube una captura para probar'
                  : 'Probar esta instrucción'
            }
            onPress={() => void probar()}
            deshabilitado={!largoValido || faltaCaptura || probando}
            iconoIzquierda={
              probando ? (
                <ActivityIndicator size="small" color={colors.texto.claro} />
              ) : (
                <Ionicons name="play" size={15} color={colors.texto.claro} />
              )
            }
          />

          {prueba ? (
            <TarjetaGlass tono={acento} activa estilo={estilos.resultado}>
              <Text style={estilos.etiquetaResultado}>RESPUESTA DE PRUEBA</Text>
              <Text style={estilos.mensaje}>{prueba.mensaje}</Text>
              <Text style={estilos.metricas}>
                Tardó {(prueba.latenciaMs / 1000).toFixed(1)} s · Esta prueba no
                gasta intentos y no se guarda
              </Text>
            </TarjetaGlass>
          ) : null}

          {tono.tambienEn.length > 0 ? (
            <View style={estilos.tambien}>
              <Text style={estilos.textoTambien}>
                Aplicar también esta instrucción a "{tono.etiqueta}" en:
              </Text>
              <View style={estilos.chips}>
                {tono.tambienEn.map((id) => {
                  const activo = tambien.includes(id);
                  return (
                    <Pressable
                      key={id}
                      onPress={() =>
                        setTambien((lista) =>
                          activo ? lista.filter((f) => f !== id) : [...lista, id],
                        )
                      }
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: activo }}
                      style={[estilos.chip, activo && estilos.chipActivo]}
                    >
                      <Ionicons
                        name={activo ? 'checkbox' : 'square-outline'}
                        size={16}
                        color={activo ? colors.marca.rosa : colors.texto.suave}
                      />
                      <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>
                        {nombreDe(id)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {tono.editado ? (
            <Pressable
              onPress={restaurar}
              accessibilityRole="button"
              hitSlop={8}
              style={estilos.restaurar}
            >
              <Ionicons name="refresh" size={15} color={colors.marca.rosa} />
              <Text style={estilos.textoRestaurar}>Restaurar original</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <View style={[estilos.pie, { paddingBottom: insets.bottom + espacio.base }]}>
          <BotonDegradado
            titulo={cambiado || tambien.length > 0 ? 'Guardar cambios' : 'Sin cambios'}
            onPress={() => void guardar()}
            deshabilitado={!puedeGuardar}
            cargando={guardando}
            iconoIzquierda={
              <Ionicons
                name="save"
                size={16}
                color={puedeGuardar ? colors.texto.blanco : colors.texto.tenue}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </FondoPantalla>
  );
}

function formatearFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  cargando: { marginVertical: espacio.xxl },
  scroll: { paddingHorizontal: espacio.lg, paddingBottom: espacio.xxl },

  aviso: { marginTop: espacio.sm, marginBottom: espacio.xl },
  textoAviso: { ...tipografia.pequeno, color: colors.texto.claro },
  fuerte: { fontWeight: '700', color: colors.texto.blanco },
  estado: {
    ...tipografia.pequeno,
    fontSize: 12,
    color: colors.texto.tenue,
    marginTop: espacio.sm,
  },

  editor: {
    minHeight: 240,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: espacio.base,
    color: colors.texto.blanco,
    ...tipografia.pequeno,
    fontSize: 14,
    lineHeight: 20,
  },
  contador: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: colors.texto.tenue,
    textAlign: 'right',
    marginTop: espacio.xs,
    marginBottom: espacio.xl,
  },
  contadorMal: { color: colors.marca.rosa },

  bloque: { marginBottom: espacio.md },
  campo: {
    minHeight: 48,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: espacio.base,
    color: colors.texto.blanco,
    ...tipografia.cuerpo,
  },

  resultado: { marginTop: espacio.md },
  etiquetaResultado: {
    ...tipografia.etiqueta,
    color: colors.texto.tenue,
    marginBottom: espacio.sm,
  },
  mensaje: {
    ...tipografia.cuerpo,
    fontSize: 16,
    lineHeight: 23,
    color: colors.texto.blanco,
  },
  metricas: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: colors.texto.tenue,
    marginTop: espacio.sm,
  },

  tambien: { marginTop: espacio.xl },
  textoTambien: { ...tipografia.pequeno, color: colors.texto.claro, marginBottom: espacio.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: espacio.md,
    paddingVertical: espacio.sm,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  chipActivo: {
    borderColor: 'rgba(255,45,138,0.55)',
    backgroundColor: 'rgba(255,45,138,0.1)',
  },
  textoChip: { ...tipografia.pequeno, color: colors.texto.suave },
  textoChipActivo: { color: colors.texto.blanco, fontWeight: '600' },

  restaurar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: espacio.xl,
    paddingVertical: espacio.sm,
  },
  textoRestaurar: { ...tipografia.pequeno, fontWeight: '600', color: colors.marca.rosa },

  pie: { paddingHorizontal: espacio.lg, paddingTop: espacio.md },
});
