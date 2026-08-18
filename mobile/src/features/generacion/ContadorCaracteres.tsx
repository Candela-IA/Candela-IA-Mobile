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

/**
 * Contador con barra de progreso para las notas de Instagram.
 *
 * El límite de 60 caracteres es real de Instagram y viene del catálogo del
 * backend, no está quemado aquí: si mañana Instagram lo cambia, se ajusta en
 * un lugar y la app lo respeta sin publicar versión nueva.
 */
export function ContadorCaracteres({
  usados,
  maximo,
}: {
  usados: number;
  maximo: number;
}) {
  const proporcion = Math.min(1, usados / maximo);
  const excedido = usados > maximo;

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.riel}>
        {excedido ? (
          <View style={[estilos.relleno, estilos.excedido]} />
        ) : (
          <LinearGradient
            colors={degradados.marca}
            start={direccionMarca.start}
            end={direccionMarca.end}
            style={[estilos.relleno, { width: `${proporcion * 100}%` }]}
          />
        )}
      </View>

      <Text
        style={[estilos.texto, excedido && { color: colors.marca.rose }]}
        accessibilityLabel={`${usados} de ${maximo} caracteres`}
      >
        {usados}/{maximo}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
  },
  riel: {
    flex: 1,
    height: 3,
    borderRadius: radio.pildora,
    backgroundColor: colors.borde,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    borderRadius: radio.pildora,
  },
  excedido: {
    width: '100%',
    backgroundColor: colors.marca.rose,
  },
  texto: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: colors.texto.tenue,
    minWidth: 42,
    textAlign: 'right',
  },
});
