import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TonoApi } from '../../core/api/candela';
import {
  colors,
  degradados,
  direccionMarca,
  espacio,
  radio,
  tipografia,
  TonoAcento,
  TONOS,
} from '../../core/theme';
import { BotonDegradado } from '../../core/ui/BotonDegradado';
import { BotonFantasma } from '../../core/ui/BotonFantasma';
import { CabeceraPantalla } from '../../core/ui/CabeceraPantalla';
import { FondoPantalla } from '../../core/ui/FondoPantalla';
import { TextoDegradado } from '../../core/ui/TextoDegradado';

const LOGO = require('../../../assets/logo-candela.png');

/**
 * PANTALLA DE RESULTADO
 *
 * Solo el mensaje, la captura y las dos acciones. El formulario desaparece
 * a propósito: en este momento el usuario ya no está eligiendo nada, está
 * decidiendo si ese mensaje le sirve. Todo lo demás estorba.
 */
export function PantallaResultado({
  mensaje,
  imagenUri,
  tonoElegido,
  acento,
  generando,
  copiado,
  onRegenerar,
  onCopiar,
  onAtras,
}: {
  mensaje: string;
  imagenUri?: string;
  tonoElegido: TonoApi | null;
  acento: TonoAcento;
  generando: boolean;
  copiado: boolean;
  onRegenerar: () => void;
  onCopiar: () => void;
  onAtras: () => void;
}) {
  const insets = useSafeAreaInsets();
  const t = TONOS[acento];

  return (
    <FondoPantalla>
      <CabeceraPantalla titulo="" onAtras={onAtras} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.scroll}
      >
        <View style={estilos.marca}>
          <Image source={LOGO} style={estilos.logo} contentFit="cover" />
          <TextoDegradado estilo={estilos.textoMarca}>Candela IA</TextoDegradado>
        </View>

        <View style={estilos.fila}>
          {tonoElegido ? (
            <Etiqueta acento={acento}>
              <Text style={estilos.emoji}>{tonoElegido.emoji}</Text>
              <Text style={estilos.textoEtiqueta}>
                Modo {tonoElegido.etiqueta}
              </Text>
            </Etiqueta>
          ) : (
            <View />
          )}

          <Efectividad acento={acento} esPremium={tonoElegido?.esPremium} />
        </View>

        {imagenUri ? (
          <View style={estilos.marcoImagen}>
            <Image
              source={{ uri: imagenUri }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
            />
          </View>
        ) : null}

        <View style={estilos.divisor}>
          <View style={estilos.linea} />
          <Text style={estilos.etiquetaDivisor}>RESPUESTA SUGERIDA</Text>
          <View style={estilos.linea} />
        </View>

        <View
          style={[
            estilos.burbuja,
            {
              borderColor: `rgba(${t.rgb},0.5)`,
              backgroundColor: `rgba(${t.rgb},0.12)`,
            },
          ]}
        >
          <LinearGradient
            colors={[`rgba(${t.rgb},0.16)`, 'transparent']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Text style={estilos.mensaje}>{mensaje}</Text>
        </View>
      </ScrollView>

      <View
        style={[estilos.pie, { paddingBottom: insets.bottom + espacio.base }]}
      >
        <BotonDegradado
          titulo={generando ? 'Generando…' : 'Generar otra respuesta'}
          onPress={onRegenerar}
          cargando={generando}
          iconoIzquierda={
            <Ionicons name="flash" size={17} color={colors.texto.blanco} />
          }
        />

        <BotonFantasma
          titulo={copiado ? '¡Copiado!' : 'Copiar y usar'}
          onPress={onCopiar}
          iconoIzquierda={
            <Ionicons
              name={copiado ? 'checkmark' : 'copy'}
              size={17}
              color={colors.marca.rosa}
            />
          }
        />
      </View>
    </FondoPantalla>
  );
}

// ── Piezas ────────────────────────────────────────────────────────────────

function Etiqueta({
  acento,
  children,
}: {
  acento: TonoAcento;
  children: React.ReactNode;
}) {
  const t = TONOS[acento];

  return (
    <View
      style={[
        estilos.pildora,
        {
          borderColor: `rgba(${t.rgb},0.38)`,
          backgroundColor: `rgba(${t.rgb},0.10)`,
        },
      ]}
    >
      {children}
    </View>
  );
}

/**
 * El indicador de efectividad del diseño.
 *
 * En el prototipo es un 4/5 fijo. Aquí se ata a algo real: los tonos con
 * corona marcan 5 y los gratis 4, que es exactamente lo que el producto
 * afirma de ellos —el premium da mejores resultados— y lo mismo que dice la
 * etiqueta "Básica / Muy buena" del prototipo.
 *
 * No es una medida de calidad de la respuesta concreta: eso no existe, y
 * fingir que sí sería mentirle al usuario con un número.
 */
function Efectividad({
  acento,
  esPremium,
}: {
  acento: TonoAcento;
  esPremium?: boolean;
}) {
  const t = TONOS[acento];
  const nivel = esPremium ? 5 : 4;

  return (
    <Etiqueta acento={acento}>
      <Text style={estilos.textoTenue}>Efectividad</Text>
      <View style={estilos.puntos}>
        {[1, 2, 3, 4, 5].map((i) =>
          i <= nivel ? (
            <LinearGradient
              key={i}
              colors={degradados.marca}
              start={direccionMarca.start}
              end={direccionMarca.end}
              style={estilos.punto}
            />
          ) : (
            <View key={i} style={[estilos.punto, estilos.puntoApagado]} />
          ),
        )}
      </View>
      <Text style={estilos.textoEtiqueta}>{nivel}/5</Text>
    </Etiqueta>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    paddingHorizontal: espacio.lg,
    paddingBottom: espacio.lg,
    gap: espacio.lg,
  },

  marca: { flexDirection: 'row', alignItems: 'center', gap: espacio.sm },
  logo: { width: 34, height: 34, borderRadius: radio.md },
  textoMarca: { ...tipografia.subtitulo },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.sm,
  },
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: espacio.md,
    paddingVertical: 6,
    borderRadius: radio.pildora,
    borderWidth: 1,
  },
  emoji: { fontSize: 13 },
  textoEtiqueta: { ...tipografia.pequeno, fontSize: 12, color: colors.texto.blanco },
  textoTenue: { ...tipografia.pequeno, fontSize: 11, color: colors.texto.suave },
  puntos: { flexDirection: 'row', gap: 3 },
  punto: { width: 6, height: 6, borderRadius: 3 },
  puntoApagado: { backgroundColor: 'rgba(255,255,255,0.15)' },

  marcoImagen: {
    height: 220,
    borderRadius: radio.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: colors.borde,
  },

  divisor: { flexDirection: 'row', alignItems: 'center', gap: espacio.md },
  linea: { flex: 1, height: 1, backgroundColor: colors.borde },
  etiquetaDivisor: {
    ...tipografia.etiqueta,
    fontSize: 10,
    color: colors.texto.tenue,
  },

  burbuja: {
    padding: espacio.base,
    borderRadius: radio.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mensaje: {
    ...tipografia.cuerpo,
    fontSize: 16,
    lineHeight: 24,
    color: colors.texto.blanco,
  },

  pie: {
    paddingHorizontal: espacio.lg,
    paddingTop: espacio.md,
    gap: espacio.md,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
  },
});
