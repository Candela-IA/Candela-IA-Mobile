import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import {
  colors,
  espacio,
  radio,
  tipografia,
  TonoAcento,
} from '../../core/theme';
import { TarjetaGlass } from '../../core/ui/TarjetaGlass';

/**
 * Vista previa para las funciones con captura (Analizar chat y Stories).
 *
 * A diferencia de Notas y Rompehielos, aquí no hay un contexto que simular:
 * el usuario ya sabe cómo se ve su chat. Lo que necesita es ver su captura
 * junto a la respuesta sugerida, para juzgar si encaja.
 */

export function VistaPreviaRespuesta({
  mensaje,
  imagenUri,
  esperando,
  tono,
}: {
  mensaje: string;
  imagenUri?: string;
  /** Aún no se ha generado nada: la tarjeta lleva el texto de espera. */
  esperando: boolean;
  tono: TonoAcento;
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

      <TarjetaGlass tono={tono} activa={!esperando} padding={espacio.base}>
        <Text style={[estilos.mensaje, esperando && estilos.mensajeEspera]}>
          {esperando ? 'Aquí aparecerá tu respuesta' : mensaje}
        </Text>
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
  mensaje: {
    ...tipografia.cuerpo,
    fontSize: 16,
    lineHeight: 23,
    color: colors.texto.blanco,
  },
  /* Apagado a propósito: se tiene que leer como un hueco por llenar, nunca
     como una respuesta que la app ya escribió. */
  mensajeEspera: { color: colors.texto.tenue },
});
