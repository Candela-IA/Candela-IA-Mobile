import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppConfig } from '../../config/app_config';
import { LinearGradient } from 'expo-linear-gradient';
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
import { IconoDegradado } from '../../core/ui/IconoDegradado';
import { borrarCaptura } from './borrarCaptura';
import { TextoDegradado } from '../../core/ui/TextoDegradado';

/**
 * Alto de la vista previa de la captura.
 *
 * Algo más que los 180 de la primera versión —para que el chat siga siendo
 * reconocible— pero lejos de lo que ocupaba dándole la forma de la imagen,
 * que dejaba el resto de la pantalla sin sitio.
 */
const ALTO_CAPTURA = 240;

export interface CapturaSeleccionada {
  /** Para mostrarla en pantalla. */
  uri: string;
  /** Para mandarla al backend. */
  base64: string;
  mimeType: string;
}

interface Props {
  captura: CapturaSeleccionada | null;
  onCambio: (captura: CapturaSeleccionada | null) => void;
  /** Las historias de IG son verticales; los chats, apaisados. */
  vertical?: boolean;
  /** Tono del borde punteado y del icono. */
  tono?: TonoAcento;
  textoVacio?: string;
  subtextoVacio?: string;
}

/**
 * Zona de "Agregar captura" con borde punteado.
 *
 * Comprime la imagen antes de convertirla a base64. Sin eso, una captura de
 * un celular moderno pesa 3-4 MB, que en base64 son ~5 MB subiendo por
 * datos móviles — lento para el usuario y caro en tokens de imagen.
 * A 1080px de ancho y calidad 0.8 baja a ~200 KB sin que la IA pierda
 * capacidad de leer el texto del chat.
 */
export function ZonaCaptura({
  captura,
  onCambio,
  vertical = false,
  tono = 'cian',
  textoVacio = 'Agregar captura',
  subtextoVacio,
}: Props) {
  const [procesando, setProcesando] = useState(false);

  const elegir = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert(
        'Sin acceso a tus fotos',
        'Candela necesita permiso para leer la captura que quieres analizar. ' +
          'Puedes activarlo en los ajustes del sistema.',
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // Sin recorte: la captura tiene que llegar completa a la IA, y
      // obligar al usuario a encuadrar solo agrega fricción.
      allowsEditing: false,
      quality: 1,
    });

    if (resultado.canceled || !resultado.assets[0]) return;

    setProcesando(true);

    try {
      const original = resultado.assets[0];

      const contexto = ImageManipulator.ImageManipulator.manipulate(original.uri);
      contexto.resize({ width: AppConfig.imagen.anchoMaximo });

      const render = await contexto.renderAsync();
      const comprimida = await render.saveAsync({
        compress: AppConfig.imagen.calidad,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      });

      if (!comprimida.base64) {
        throw new Error('No pude leer la imagen.');
      }

      // La anterior ya no sirve para nada: fuera antes de anunciar la
      // nueva, para que nunca haya dos copias vivas a la vez.
      borrarCaptura(captura?.uri);

      onCambio({
        uri: comprimida.uri,
        base64: comprimida.base64,
        mimeType: 'image/jpeg',
      });
    } catch {
      Alert.alert(
        'No pudimos leer la captura',
        'Intenta con otra imagen de tu galería.',
      );
    } finally {
      setProcesando(false);
    }
  };

  if (captura) {
    return (
      <View style={[estilos.marco, vertical && estilos.marcoVertical]}>
        <Image
          source={{ uri: captura.uri }}
          style={StyleSheet.absoluteFill}
          // `contain` y no `cover`: el usuario tiene que ver su captura
          // entera. Recortarla le hace dudar de qué le está mandando a la IA
          // —que sí la recibe completa—.
          contentFit="contain"
        />
        <Pressable
          onPress={() => {
            borrarCaptura(captura.uri);
            onCambio(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="Quitar captura"
          hitSlop={10}
          style={estilos.quitar}
        >
          <Ionicons name="close" size={18} color={colors.texto.blanco} />
        </Pressable>
      </View>
    );
  }

  const t = TONOS[tono];

  return (
    <Pressable
      onPress={elegir}
      disabled={procesando}
      accessibilityRole="button"
      accessibilityLabel={textoVacio}
      style={({ pressed }) => [
        estilos.zona,
        { borderColor: `rgba(${t.rgb},0.45)` },
        pressed && estilos.presionada,
      ]}
    >
      <LinearGradient
        colors={[`rgba(${t.rgb},0.10)`, 'rgba(9,9,11,0.9)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {vertical ? (
        <MarcoHistoria tono={tono} procesando={procesando} />
      ) : (
        <IconoDegradado
          nombre={procesando ? 'hourglass' : 'images'}
          tono="cian"
          tamano={44}
          radio={14}
        />
      )}

      <View style={estilos.textos}>
        <TextoDegradado estilo={estilos.textoVacio}>
          {procesando ? 'Preparando…' : textoVacio}
        </TextoDegradado>
        {subtextoVacio ? (
          <Text style={estilos.subtextoVacio}>{subtextoVacio}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Marco vertical con proporción de historia de Instagram (74×118).
 *
 * El borde es el degradado de marca: se logra con un contenedor degradado
 * de 2px de padding y un rectángulo oscuro encima. React Native no admite
 * un degradado como color de borde.
 */
function MarcoHistoria({
  tono,
  procesando,
}: {
  tono: TonoAcento;
  procesando: boolean;
}) {
  const t = TONOS[tono];

  return (
    <LinearGradient
      colors={degradados.marca}
      start={direccionMarca.start}
      end={direccionMarca.end}
      style={estilos.marcoHistoria}
    >
      <View style={estilos.interiorHistoria}>
        <Ionicons
          name={procesando ? 'hourglass-outline' : 'camera-outline'}
          size={24}
          color={`rgba(${t.rgb},0.9)`}
        />
      </View>
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  // Sin alto fijo: crece con su contenido, que es lo que hace el prototipo
  // (py-7). Así el marco de historia y el icono de chat conviven sin dejar
  // huecos ni recortarse.
  zona: {
    borderRadius: 26,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  presionada: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  textos: { alignItems: 'center', gap: 2 },
  textoVacio: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  subtextoVacio: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.4)',
  },
  marcoHistoria: {
    width: 74,
    height: 118,
    borderRadius: 18,
    padding: 2,
    opacity: 0.85,
  },
  interiorHistoria: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oscuro.carbon,
  },
  marco: {
    /**
     * Alto fijo, y la captura dentro con `contain`.
     *
     * La primera versión daba al marco la forma de la imagen, y una captura
     * de chat —altísima— se comía la pantalla y empujaba los tonos y el
     * botón fuera de vista. Prefieren verla pequeña y entera antes que
     * grande y recortada, así que el marco manda y la imagen se ajusta.
     */
    height: ALTO_CAPTURA,
    // Ancho completo: es lo que permite que `contain` la deje centrada.
    alignSelf: 'stretch',
    borderRadius: radio.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borde,
    // Con `contain` sobra marco a los lados; que se vea el color de tarjeta
    // y no un hueco transparente.
    backgroundColor: colors.tarjeta,
  },
  // Las historias de IG son mas altas; algo mas de sitio para que se lea.
  marcoVertical: { height: 300 },
  quitar: {
    position: 'absolute',
    top: espacio.md,
    right: espacio.md,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
