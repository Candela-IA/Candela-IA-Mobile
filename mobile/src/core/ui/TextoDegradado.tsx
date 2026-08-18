import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TextStyle } from 'react-native';

import { degradados, direccionMarca } from '../theme';

interface Props {
  children: string;
  estilo?: TextStyle;
}

/**
 * Texto pintado con el degradado de marca.
 *
 * Es lo que hace el diseño con "Candela IA", "se enfría?", "oportunidad" y
 * "conexiones": la frase va en blanco y solo la palabra clave lleva color.
 *
 * React Native no permite un degradado como color de texto, así que se usa
 * el texto como máscara sobre un degradado — que es cómo se resuelve
 * siempre este efecto.
 */
export function TextoDegradado({ children, estilo }: Props) {
  return (
    <MaskedView
      maskElement={
        <Text style={[estilo, estilos.mascara]}>{children}</Text>
      }
    >
      <LinearGradient
        colors={degradados.marca}
        start={direccionMarca.start}
        end={direccionMarca.end}
      >
        {/* Texto invisible que reserva exactamente el mismo espacio: sin
            él, el degradado no sabría qué tamaño ocupar. */}
        <Text style={[estilo, estilos.fantasma]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const estilos = StyleSheet.create({
  mascara: {
    backgroundColor: 'transparent',
  },
  fantasma: {
    opacity: 0,
  },
});
