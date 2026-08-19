import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import {
  colors,
  degradados,
  direccionMarca,
  espacio,
  radio,
  tipografia,
} from '../../core/theme';
import { TarjetaGlass } from '../../core/ui/TarjetaGlass';

/**
 * Vista previa de una nota de Instagram.
 *
 * Muestra el mensaje en el lugar donde el usuario lo va a usar de verdad.
 * Es el detalle que convierte "un texto generado" en "mi nota lista para
 * publicar": ver la burbuja sobre la foto de perfil comunica el resultado
 * mucho mejor que un cuadro de texto suelto.
 *
 * Antes de generar muestra un ejemplo etiquetado como tal, así la pantalla
 * nunca se ve vacía y se entiende de inmediato qué se va a obtener.
 */

/**
 * Foto de perfil de la maqueta.
 *
 * Es decorativa: representa al usuario dentro del mock de Instagram. Con el
 * icono genérico anterior la vista previa se leía como un formulario; con
 * una foto real se lee como la bandeja de Instagram, que es justo lo que
 * esta pantalla intenta comunicar.
 */
const AVATAR = require('../../../assets/avatar-nota.webp');

export const NOTA_EJEMPLO = 'Buscando a alguien que me robe una sonrisa 💜';

export function VistaPreviaNota({
  nota,
  esEjemplo,
}: {
  nota: string;
  esEjemplo: boolean;
}) {
  return (
    <TarjetaGlass tono="rosa" padding={0} estilo={estilos.tarjeta}>
      {/* Cabecera al estilo de la bandeja de Instagram */}
      <View style={estilos.cabecera}>
        <Text style={estilos.tituloNotas}>Notas</Text>
        <View style={estilos.visible}>
          <Ionicons name="eye-outline" size={12} color={colors.texto.tenue} />
          <Text style={estilos.textoVisible}>Visible 24 h</Text>
        </View>
      </View>

      <View style={estilos.separador} />

      <View style={estilos.cuerpo}>
        {esEjemplo ? (
          <View style={estilos.insigniaEjemplo}>
            <Text style={estilos.textoEjemplo}>EJEMPLO</Text>
          </View>
        ) : null}

        <View style={estilos.burbuja}>
          <Text style={estilos.textoNota}>{nota}</Text>
          {/* Colita de la burbuja, como en Instagram. */}
          <View style={estilos.colita} />
        </View>

        {/* Foto de perfil con anillo degradado. */}
        <LinearGradient
          colors={degradados.marca}
          start={direccionMarca.start}
          end={direccionMarca.end}
          style={estilos.anillo}
        >
          <View style={estilos.avatar}>
            <Image source={AVATAR} style={estilos.foto} contentFit="cover" />
          </View>
        </LinearGradient>

        <Text style={estilos.tuNota}>Tu nota</Text>
      </View>

      <View style={estilos.separador} />

      <View style={estilos.pie}>
        <Ionicons name="logo-instagram" size={12} color={colors.marca.rosa} />
        <Text style={estilos.textoPie}>Vista previa de tu nota</Text>
        <Text style={estilos.punto}>•</Text>
        <Ionicons name="time-outline" size={12} color={colors.texto.tenue} />
        <Text style={estilos.textoPie}>Visible 24 h</Text>
      </View>
    </TarjetaGlass>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { overflow: 'hidden' },

  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espacio.base,
    paddingVertical: espacio.md,
  },
  tituloNotas: {
    ...tipografia.cuerpoFuerte,
    color: colors.texto.claro,
  },
  visible: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textoVisible: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: colors.texto.tenue,
  },

  separador: { height: 1, backgroundColor: colors.borde },

  cuerpo: {
    alignItems: 'center',
    paddingVertical: espacio.lg,
    gap: espacio.sm,
  },
  insigniaEjemplo: {
    paddingHorizontal: espacio.sm,
    paddingVertical: 3,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: `rgba(255,45,138,0.5)`,
    backgroundColor: 'rgba(255,45,138,0.12)',
  },
  textoEjemplo: {
    ...tipografia.etiqueta,
    fontSize: 9,
    color: colors.marca.rosa,
  },

  burbuja: {
    maxWidth: '86%',
    paddingHorizontal: espacio.base,
    paddingVertical: espacio.md,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,45,138,0.45)',
    backgroundColor: 'rgba(255,45,138,0.10)',
  },
  textoNota: {
    ...tipografia.cuerpo,
    color: colors.texto.blanco,
    textAlign: 'center',
  },
  colita: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,45,138,0.45)',
    backgroundColor: 'rgba(255,45,138,0.10)',
  },

  anillo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 2.5,
    marginTop: espacio.sm,
  },
  avatar: {
    flex: 1,
    borderRadius: 36,
    // `overflow` recorta la foto al círculo: sin él, la imagen cuadrada
    // asoma por las esquinas y se come el anillo degradado.
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oscuro.carbon,
  },
  foto: { width: '100%', height: '100%' },
  tuNota: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: colors.texto.tenue,
  },

  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: espacio.md,
  },
  textoPie: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: colors.texto.tenue,
  },
  punto: { color: colors.texto.tenue, fontSize: 11 },
});
