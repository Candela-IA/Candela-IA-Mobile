import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DefinicionFuncionApi,
  FuncionApi,
  obtenerCatalogo,
  TonoApi,
} from '../../core/api/candela';
import { useSesion } from '../../core/di/sesion';
import {
  colors,
  espacio,
  radio,
  tipografia,
  TonoAcento,
  TONOS,
} from '../../core/theme';
import { BotonDegradado } from '../../core/ui/BotonDegradado';
import { CabeceraPantalla } from '../../core/ui/CabeceraPantalla';
import { ChipTono } from '../../core/ui/ChipTono';
import { EtiquetaSeccion } from '../../core/ui/EtiquetaSeccion';
import { FondoPantalla } from '../../core/ui/FondoPantalla';
import { IconoDegradado } from '../../core/ui/IconoDegradado';
import { TarjetaGlass } from '../../core/ui/TarjetaGlass';
import { ChecklistCarga } from './ChecklistCarga';
import { ContadorCaracteres } from './ContadorCaracteres';
import { usarGeneracion } from './usarGeneracion';
import { ROMPEHIELOS_EJEMPLO, VistaPreviaChat } from './VistaPreviaChat';
import { NOTA_EJEMPLO, VistaPreviaNota } from './VistaPreviaNota';
import {
  RESPUESTA_EJEMPLO,
  VistaPreviaRespuesta,
} from './VistaPreviaRespuesta';
import { borrarCaptura } from './borrarCaptura';
import { CapturaSeleccionada, ZonaCaptura } from './ZonaCaptura';

interface Props {
  funcion: FuncionApi;
  titulo: string;
  /** Frase del banner superior. */
  gancho: string;
  /** Parte de la frase que va en degradado. */
  ganchoDestacado?: string;
  subGancho: string;
  /** Solo Analizar chat muestra el tono elegido en el banner. */
  mostrarTonoEnBanner?: boolean;
  icono: keyof typeof Ionicons.glyphMap;
  tono: TonoAcento;
  textoBoton: string;
  /** Las historias de IG usan zona de captura vertical. */
  capturaVertical?: boolean;
  /**
   * El usuario gratis recibe el tono base sin elegirlo. Oculta la sección
   * de tonos gratis y deja los premium como puro anzuelo (Rompehielos).
   */
  tonoImplicito?: boolean;
  /**
   * Sube la vista previa por encima de los modos de respuesta.
   *
   * Crear notas no pide captura ni contexto, así que sin esto la pantalla
   * empieza directamente por la grilla de tonos y la nota —que es lo que el
   * usuario viene a ver— queda enterrada al final.
   */
  previaArriba?: boolean;
}

/**
 * Pantalla compartida por las cuatro funciones.
 *
 * Las cuatro tienen la misma estructura —banner, captura opcional, contexto
 * opcional, grilla de tonos, botón— y lo que cambia lo dice el catálogo del
 * backend: si pide imagen, si acepta contexto, qué tonos ofrece y cuáles
 * llevan corona.
 *
 * Escribir cuatro pantallas casi idénticas habría significado corregir cada
 * ajuste cuatro veces.
 */
export function PantallaGeneracion({
  funcion,
  titulo,
  gancho,
  ganchoDestacado,
  subGancho,
  mostrarTonoEnBanner = false,
  icono,
  tono,
  textoBoton,
  capturaVertical = false,
  tonoImplicito = false,
  previaArriba = false,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { token, saldo, iniciar } = useSesion();

  const [captura, setCaptura] = useState<CapturaSeleccionada | null>(null);
  const [contexto, setContexto] = useState('');
  const [tonoId, setTonoId] = useState<string | null>(null);

  useEffect(() => {
    void iniciar();
  }, [iniciar]);

  /**
   * Al salir de la pantalla, la copia comprimida de la captura se borra.
   *
   * Se lee de una ref y no del estado a propósito: el efecto de limpieza
   * captura el valor que había cuando se montó, y para entonces todavía no
   * hay ninguna captura. La ref siempre tiene la última.
   */
  const capturaViva = useRef<CapturaSeleccionada | null>(null);
  capturaViva.current = captura;

  useEffect(() => {
    return () => borrarCaptura(capturaViva.current?.uri);
  }, []);

  const catalogo = useQuery({
    queryKey: ['catalogo'],
    queryFn: obtenerCatalogo,
    staleTime: 5 * 60_000,
    // Menos reintentos y sin espera creciente, a diferencia del resto de la
    // app: sin catálogo esta pantalla no puede hacer NADA, así que más vale
    // avisar en unos segundos que insistir medio minuto contra un servidor
    // que no responde mientras el usuario mira una ruedita.
    retry: 2,
    retryDelay: 1_000,
  });

  const definicion = catalogo.data?.find((f) => f.id === funcion);

  // El primer tono gratis queda elegido de entrada: obligar a elegir antes
  // de poder hacer nada es fricción sin ganancia.
  useEffect(() => {
    if (!tonoId && definicion) {
      const primero = definicion.tonos.find((t) => !t.esPremium);
      if (primero) setTonoId(primero.id);
    }
  }, [definicion, tonoId]);

  const tonoElegido = definicion?.tonos.find((t) => t.id === tonoId) ?? null;

  /**
   * El acento de TODA la pantalla, no solo del chip.
   *
   * En el diseño, elegir un modo repinta el banner, los bordes y la vista
   * previa: el color es la confirmación de qué modo está activo, y verlo
   * solo en el chip obliga a buscarlo. Mientras el catálogo no ha llegado
   * se usa el tono propio de la pantalla.
   */
  const acento: TonoAcento = tonoElegido?.color ?? tono;

  const { gratis, premium } = useMemo(() => separarTonos(definicion), [definicion]);

  // Los chips con descripción necesitan más ancho, así que van de a dos por
  // fila; los que solo llevan etiqueta caben de a tres.
  const anchoDe = (columnas: number) =>
    (width - espacio.lg * 2 - espacio.md * (columnas - 1)) / columnas;

  // Con descripción hacen falta dos columnas; sin ella caben tres, o
  // cuatro cuando son exactamente cuatro (la fila premium de Rompehielos).
  const columnasDe = (tonos: TonoApi[]) => {
    if (tonos.some((t) => t.descripcion)) return 2;
    return tonos.length === 4 ? 4 : 3;
  };

  const {
    resultado,
    esEjemplo,
    generando,
    generar: pedirGeneracion,
    copiar,
    copiado,
  } = usarGeneracion({
    funcion,
    // Sin créditos o tono premium sin suscripción → paywall, no un error.
    onSinCreditos: () => router.push('/premium'),
  });

  const faltaCaptura = Boolean(definicion?.requiereImagen) && !captura;
  const puedeGenerar = Boolean(token && tonoElegido && !faltaCaptura && !generando);

  const generar = () => {
    if (!tonoElegido) return;

    pedirGeneracion({
      tono: tonoElegido.id,
      captura,
      contexto: contexto.trim(),
      // Cada vez después de la primera cuenta como regeneración. Solo sirve
      // para métricas: el crédito se cobra igual.
      esRegeneracion: resultado !== null,
    });
  };

  /** El texto que se muestra: el resultado real o el ejemplo de la función. */
  const mensajeVisible = resultado ?? ejemploDe(funcion);

  /**
   * El checklist solo tiene sentido cuando hay una captura que analizar.
   *
   * Sus pasos —"leyendo la captura", "entendiendo el contexto"— describen
   * un trabajo que en Rompehielos y Crear notas no existe: ahí no hay
   * imagen y la respuesta llega en un par de segundos. Mostrarlo sería
   * inventar una espera, y encima taparía la vista previa que el usuario
   * está mirando. En esas dos el texto se releva en su sitio y basta con el
   * indicador del botón.
   */
  const conChecklist = generando && Boolean(definicion?.requiereImagen);

  /**
   * La vista previa, extraída para poder colocarla en dos sitios distintos
   * sin duplicar el bloque: encima de los modos de respuesta cuando la
   * pantalla no tiene captura ni contexto, y al final en el resto.
   */
  const bloquePrevia = definicion ? (
    <View style={estilos.bloque}>
      <Text style={estilos.etiquetaCaptura}>{ETIQUETA_PREVIA[funcion]}</Text>

      {conChecklist ? (
        <ChecklistCarga conImagen />
      ) : (
        // La clave es el propio mensaje: cuando llega uno nuevo el bloque se
        // remonta y entra con un fundido, así el texto se releva en el mismo
        // sitio en vez de aparecer de golpe.
        <Animated.View
          key={mensajeVisible}
          entering={FadeIn.duration(260)}
          style={generando ? estilos.previaGenerando : undefined}
        >
          <VistaPrevia
            funcion={funcion}
            mensaje={mensajeVisible}
            esEjemplo={esEjemplo}
            imagenUri={captura?.uri}
            etiquetaTono={tonoElegido?.etiqueta ?? ''}
            emojiTono={tonoElegido?.emoji ?? ''}
            tono={acento}
          />
        </Animated.View>
      )}

      {definicion.maxCaracteres !== null && !conChecklist ? (
        <View style={estilos.contadorNota}>
          <ContadorCaracteres
            usados={[...mensajeVisible].length}
            maximo={definicion.maxCaracteres}
          />
        </View>
      ) : null}
    </View>
  ) : null;

  return (
    <FondoPantalla>
      <CabeceraPantalla
        titulo={titulo}
        derecha={saldo ? <Contador saldo={saldo} /> : undefined}
      />

      <KeyboardAvoidingView
        style={estilos.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={estilos.scroll}
        >
          {/* Banner del gancho */}
          <TarjetaGlass tono={acento} estilo={estilos.banner}>
            <View style={estilos.filaBanner}>
              <IconoDegradado nombre={icono} tono={acento} tamano={44} radio={14} />
              <View style={estilos.flex}>
                <Text style={estilos.textoGancho}>
                  {gancho}
                  {ganchoDestacado ? (
                    <Text style={{ color: colors.marca.rosa }}>
                      {' '}
                      {ganchoDestacado}
                    </Text>
                  ) : null}
                  {mostrarTonoEnBanner && tonoElegido ? (
                    <Text style={{ color: colors.marca.rosa }}>
                      {'  '}
                      {tonoElegido.emoji} {tonoElegido.etiqueta}
                    </Text>
                  ) : null}
                </Text>
                <Text style={estilos.textoSubGancho}>{subGancho}</Text>
              </View>
            </View>
          </TarjetaGlass>

          {catalogo.isPending ? (
            <View style={estilos.cargando}>
              <ActivityIndicator color={colors.marca.rosa} />
            </View>
          ) : null}

          {catalogo.isError ? (
            <TarjetaGlass tono="rose" estilo={estilos.error}>
              <Text style={estilos.textoError}>
                No pudimos cargar los modos de respuesta. Revisa tu conexión.
              </Text>
              {/* Sin este botón habría que salir de la pantalla y volver a
                  entrar para reintentar, que es justo lo que nadie adivina
                  cuando algo falla. */}
              <Pressable
                onPress={() => void catalogo.refetch()}
                accessibilityRole="button"
                disabled={catalogo.isFetching}
                style={({ pressed }) => [
                  estilos.botonReintentar,
                  pressed && estilos.reintentarPresionado,
                ]}
              >
                {catalogo.isFetching ? (
                  <ActivityIndicator size="small" color={colors.marca.rose} />
                ) : (
                  <>
                    <Ionicons
                      name="refresh"
                      size={14}
                      color={colors.marca.rose}
                    />
                    <Text style={estilos.textoReintentar}>Reintentar</Text>
                  </>
                )}
              </Pressable>
            </TarjetaGlass>
          ) : null}

          {definicion ? (
            <>
              {definicion.requiereImagen ? (
                <View style={estilos.bloque}>
                  {/* Esta etiqueta va en mayúsculas sin icono, a diferencia
                      de "Modo de respuesta". Así lo hace el diseño. */}
                  <Text style={estilos.etiquetaCaptura}>
                    {capturaVertical
                      ? 'Captura de la historia'
                      : 'Captura de la conversación'}
                  </Text>
                  <ZonaCaptura
                    captura={captura}
                    onCambio={setCaptura}
                    vertical={capturaVertical}
                    tono={acento}
                    subtextoVacio={
                      capturaVertical
                        ? 'Sube la historia que quieres analizar'
                        : undefined
                    }
                  />
                </View>
              ) : null}

              {definicion.aceptaContexto ? (
                <View style={estilos.bloque}>
                  <EtiquetaSeccion icono="create" tono="purpura">
                    Dale el contexto a la IA (opcional)
                  </EtiquetaSeccion>
                  <TextInput
                    value={contexto}
                    onChangeText={setContexto}
                    placeholder="Escribe aquí lo que quieras contarle a la IA…"
                    placeholderTextColor={colors.texto.tenue}
                    multiline
                    maxLength={500}
                    style={estilos.campoContexto}
                  />
                </View>
              ) : null}

              {previaArriba ? bloquePrevia : null}

              <View style={estilos.bloque}>
                {tonoImplicito ? null : (
                  <>
                    <EtiquetaSeccion icono="sparkles" tono="rosa">
                      Modo de respuesta
                    </EtiquetaSeccion>

                    <Text style={estilos.etiquetaNivel}>BÁSICO · GRATIS</Text>
                    <View style={estilos.grilla}>
                      {gratis.map((t) => (
                        <ChipTono
                          key={t.id}
                          emoji={t.emoji}
                          etiqueta={t.etiqueta}
                          descripcion={t.descripcion ?? undefined}
                          seleccionado={t.id === tonoId}
                          tono={t.color}
                          ancho={anchoDe(columnasDe(gratis))}
                          onPress={() => setTonoId(t.id)}
                        />
                      ))}
                    </View>
                  </>
                )}

                {premium.length > 0 ? (
                  <>
                    <View
                      style={[
                        estilos.divisorPremium,
                        tonoImplicito && { marginTop: 0 },
                      ]}
                    >
                      <Ionicons
                        name="star"
                        size={12}
                        color={colors.estado.premium}
                      />
                      <Text style={estilos.etiquetaPremium}>PREMIUM</Text>
                      <View style={estilos.lineaPremium} />
                    </View>

                    <View style={estilos.grilla}>
                      {premium.map((t) => (
                        <ChipTono
                          key={t.id}
                          emoji={t.emoji}
                          etiqueta={t.etiqueta}
                          descripcion={t.descripcion ?? undefined}
                          seleccionado={t.id === tonoId}
                          bloqueado={!saldo?.esPremium}
                          tono={t.color}
                          ancho={anchoDe(columnasDe(premium))}
                          onPress={() => {
                            if (saldo?.esPremium) setTonoId(t.id);
                            else router.push('/premium');
                          }}
                        />
                      ))}
                    </View>
                  </>
                ) : null}
              </View>

              {previaArriba ? null : bloquePrevia}
            </>
          ) : null}
        </ScrollView>

        <View style={[estilos.pie, { paddingBottom: insets.bottom + espacio.base }]}>
          <LinearGradient
            colors={['transparent', colors.fondo]}
            style={estilos.velo}
            pointerEvents="none"
          />
          <BotonDegradado
            titulo={
              faltaCaptura
                ? 'Sube una captura primero'
                : resultado
                  ? textoBotonRegenerar(textoBoton)
                  : textoBoton
            }
            onPress={generar}
            deshabilitado={!puedeGenerar}
            cargando={generando}
            iconoIzquierda={
              <Ionicons
                name={resultado ? 'refresh' : 'sparkles'}
                size={16}
                color={puedeGenerar ? colors.texto.blanco : colors.texto.tenue}
              />
            }
          />

          {/* El botón de copiar solo aparece cuando hay algo real que
              copiar. Con el ejemplo en pantalla sería copiar texto de
              muestra, que no le sirve a nadie. */}
          {resultado && !generando ? (
            <Pressable
              onPress={copiar}
              accessibilityRole="button"
              style={({ pressed }) => [
                estilos.botonCopiar,
                pressed && estilos.copiarPresionado,
              ]}
            >
              <Ionicons
                name={copiado ? 'checkmark' : 'copy-outline'}
                size={16}
                color={copiado ? colors.estado.exito : colors.texto.blanco}
              />
              <Text
                style={[
                  estilos.textoCopiar,
                  copiado && { color: colors.estado.exito },
                ]}
              >
                {copiado ? '¡Copiado!' : TEXTO_COPIAR[funcion]}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </FondoPantalla>
  );
}

// ── Piezas ────────────────────────────────────────────────────────────────

/** Cada función simula el contexto donde el mensaje se va a usar. */
function VistaPrevia({
  funcion,
  mensaje,
  esEjemplo,
  imagenUri,
  etiquetaTono,
  emojiTono,
  tono,
}: {
  funcion: FuncionApi;
  mensaje: string;
  esEjemplo: boolean;
  imagenUri?: string;
  etiquetaTono: string;
  emojiTono: string;
  tono: TonoAcento;
}) {
  if (funcion === 'CREAR_NOTAS') {
    return <VistaPreviaNota nota={mensaje} esEjemplo={esEjemplo} tono={tono} />;
  }

  if (funcion === 'ROMPEHIELOS') {
    return (
      <VistaPreviaChat
        mensaje={mensaje}
        etiquetaTono={etiquetaTono}
        emojiTono={emojiTono}
        esEjemplo={esEjemplo}
        tono={tono}
      />
    );
  }

  return (
    <VistaPreviaRespuesta
      mensaje={mensaje}
      imagenUri={imagenUri}
      esEjemplo={esEjemplo}
      tono={tono}
    />
  );
}

const ETIQUETA_PREVIA: Record<FuncionApi, string> = {
  CREAR_NOTAS: 'Vista previa en Instagram',
  ROMPEHIELOS: 'Vista previa del chat',
  ANALIZAR_CHAT: 'Tu respuesta',
  ANALIZAR_STORIES: 'Tu respuesta',
};

const TEXTO_COPIAR: Record<FuncionApi, string> = {
  CREAR_NOTAS: 'Copiar nota',
  ROMPEHIELOS: 'Copiar y enviar',
  ANALIZAR_CHAT: 'Copiar y usar',
  ANALIZAR_STORIES: 'Copiar y usar',
};

function ejemploDe(funcion: FuncionApi): string {
  if (funcion === 'CREAR_NOTAS') return NOTA_EJEMPLO;
  if (funcion === 'ROMPEHIELOS') return ROMPEHIELOS_EJEMPLO;
  return RESPUESTA_EJEMPLO;
}

/** "Generar nota" → "Generar otra nota". */
function textoBotonRegenerar(original: string): string {
  return original.replace(/^Generar /, 'Generar otro ').replace(/^Analizar /, 'Analizar de nuevo ');
}

function Contador({
  saldo,
}: {
  saldo: { esPremium: boolean; gratisUsados: number; gratisTotales: number };
}) {
  if (saldo.esPremium) {
    return (
      <View style={estilos.contador}>
        <Ionicons name="star" size={11} color={colors.estado.premium} />
      </View>
    );
  }

  return (
    <View style={estilos.contador}>
      <Text style={estilos.textoContador}>
        {saldo.gratisUsados}/{saldo.gratisTotales}
      </Text>
    </View>
  );
}

function separarTonos(definicion: DefinicionFuncionApi | undefined): {
  gratis: TonoApi[];
  premium: TonoApi[];
} {
  if (!definicion) return { gratis: [], premium: [] };

  return {
    gratis: definicion.tonos.filter((t) => !t.esPremium),
    premium: definicion.tonos.filter((t) => t.esPremium),
  };
}

// ── Estilos ───────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  // Aire suficiente para que la ultima fila de chips quede completamente
  // visible al llegar al final, sin quedar pegada al boton.
  scroll: { paddingHorizontal: espacio.lg, paddingBottom: espacio.xxl },

  banner: { marginBottom: espacio.xl },
  filaBanner: { flexDirection: 'row', alignItems: 'center', gap: espacio.md },
  textoGancho: {
    ...tipografia.cuerpoFuerte,
    color: colors.texto.blanco,
    marginBottom: 2,
  },
  textoSubGancho: { ...tipografia.pequeno, color: colors.texto.suave },

  cargando: { paddingVertical: espacio.xxl, alignItems: 'center' },
  previaGenerando: { opacity: 0.45 },
  error: { marginBottom: espacio.base },
  textoError: { ...tipografia.cuerpo, color: colors.texto.claro },
  botonReintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.sm,
    alignSelf: 'flex-start',
    marginTop: espacio.md,
    minHeight: 34,
    paddingHorizontal: espacio.base,
    paddingVertical: espacio.sm,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: `rgba(${TONOS.rose.rgb},0.45)`,
  },
  reintentarPresionado: { opacity: 0.6 },
  textoReintentar: {
    ...tipografia.pequeno,
    fontWeight: '600',
    color: colors.marca.rose,
  },

  bloque: { marginBottom: espacio.xl },

  campoContexto: {
    minHeight: 110,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: espacio.base,
    color: colors.texto.blanco,
    textAlignVertical: 'top',
    ...tipografia.cuerpo,
  },

  etiquetaCaptura: {
    ...tipografia.etiqueta,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 10,
  },
  etiquetaNivel: {
    ...tipografia.etiqueta,
    color: colors.texto.tenue,
    marginBottom: espacio.md,
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacio.md,
  },
  divisorPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.sm,
    marginTop: espacio.lg,
    marginBottom: espacio.md,
  },
  etiquetaPremium: {
    ...tipografia.etiqueta,
    color: colors.estado.premium,
  },
  lineaPremium: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(245,158,11,0.25)',
  },

  pie: {
    paddingHorizontal: espacio.lg,
    paddingTop: espacio.md,
    gap: espacio.md,
  },
  contadorNota: { marginTop: espacio.md },
  botonCopiar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.sm,
    minHeight: 52,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  copiarPresionado: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  textoCopiar: { ...tipografia.boton, fontSize: 15, color: colors.texto.blanco },
  // El contenido que pasa por detras del boton se desvanece hacia el fondo
  // en lugar de cortarse con un filo.
  velo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    height: 28,
  },
  contador: {
    paddingHorizontal: espacio.sm,
    paddingVertical: 4,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  textoContador: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: colors.texto.claro,
  },
});
