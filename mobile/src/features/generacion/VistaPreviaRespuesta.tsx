import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, espacio, radio, tipografia } from '../../core/theme';
import { TarjetaGlass } from '../../core/ui/TarjetaGlass';

/**
 * Vista previa para las funciones con captura (Analizar chat y Stories).
 *
 * A diferencia de Notas y Rompehielos, aquí no hay un contexto que simular:
 * el usuario ya sabe cómo se ve su chat. Lo que necesita es ver su captura
 * junto a la respuesta sugerida, para juzgar si encaja.
 */

export const RESPUESTA_EJEMPLO =
  'Hay personas que te hacen querer apagar el teléfono y hay personas que te hacen querer seguir escribiendo. Tú eres de las segundas ❤️';

export function VistaPreviaRespuesta({
  mensaje,
  imagenUri,
  esEjemplo,
}: {
  mensaje: string;
  imagenUri?: string;
  esEjemplo: boolean;
}) {
  return (
    <View style={estilos.contenedor}>
      {imagenUri ? (
        <Image
          source={{ uri: imagenUri }}
          style={estilos.captura}
          contentFit="cover"
        />
      ) : null}

      <View style={estilos.divisor}>
        <View style={estilos.linea} />
        <Text style={estilos.etiqueta}>
          {esEjemplo ? 'Ejemplo de respuesta' : 'Respuesta sugerida'}
        </Text>
        <View style={estilos.linea} />
      </View>

      <TarjetaGlass tono="rosa" activa={!esEjemplo} padding={espacio.base}>
        <Text style={estilos.mensaje}>{mensaje}</Text>
      </TarjetaGlass>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.base },
  captura: {
    width: '100%',
    height: 170,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
  },
  linea: { flex: 1, height: 1, backgroundColor: colors.borde },
  etiqueta: {
    ...tipografia.etiqueta,
    color: colors.texto.tenue,
  },
  mensaje: {
    ...tipografia.cuerpo,
    fontSize: 16,
    lineHeight: 23,
    color: colors.texto.blanco,
  },
});
