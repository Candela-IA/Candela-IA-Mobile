import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppConfig } from '../../config/app_config';
import { colors, espacio, radio, tipografia } from '../theme';
import { BotonDegradado } from './BotonDegradado';
import { FondoPantalla } from './FondoPantalla';
import { IconoDegradado } from './IconoDegradado';
import { contactarSoporte } from '../legal';

/**
 * La pantalla que aparece cuando algo revienta.
 *
 * Sin esto, una excepción en cualquier pantalla deja la app en blanco o la
 * cierra, y el usuario no tiene salida: reabrir suele llevarlo al mismo
 * sitio roto. Aquí al menos puede reintentar y escribirnos.
 *
 * El detalle técnico solo se muestra en desarrollo. En producción no le
 * sirve a nadie y solo transmite que algo se rompió por dentro.
 */
export function PantallaError({
  error,
  reintentar,
}: {
  error: Error;
  reintentar: () => void;
}) {
  return (
    <FondoPantalla animaciones={false} particulas={false}>
      <ScrollView contentContainerStyle={estilos.scroll}>
        <IconoDegradado nombre="warning" tono="rose" tamano={56} radio={18} />

        <Text style={estilos.titulo}>Algo se rompió</Text>

        <Text style={estilos.descripcion}>
          No es culpa tuya. Puedes intentarlo de nuevo; si vuelve a pasar,
          escríbenos y lo revisamos.
        </Text>

        <View style={estilos.acciones}>
          <BotonDegradado
            titulo="Reintentar"
            onPress={reintentar}
            iconoIzquierda={
              <Ionicons name="refresh" size={17} color={colors.texto.blanco} />
            }
          />

          <BotonDegradado
            titulo="Escribirnos"
            subtitulo="Cuéntanos qué estabas haciendo"
            onPress={() => void contactarSoporte()}
            iconoIzquierda={
              <Ionicons name="mail" size={17} color={colors.texto.blanco} />
            }
          />
        </View>

        {/* Solo en desarrollo: en producción este texto no ayuda al usuario
            y sí revela cómo está construida la app por dentro. */}
        {AppConfig.esDesarrollo ? (
          <View style={estilos.detalle}>
            <Text style={estilos.tituloDetalle}>Detalle (solo en desarrollo)</Text>
            <Text style={estilos.textoDetalle}>{error.message}</Text>
            {error.stack ? (
              <Text style={estilos.pila} numberOfLines={12}>
                {error.stack}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </FondoPantalla>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacio.lg,
    gap: espacio.base,
  },
  titulo: {
    ...tipografia.titulo,
    color: colors.texto.blanco,
    textAlign: 'center',
    marginTop: espacio.sm,
  },
  descripcion: {
    ...tipografia.cuerpo,
    color: colors.texto.suave,
    textAlign: 'center',
    maxWidth: 320,
  },
  acciones: {
    alignSelf: 'stretch',
    gap: espacio.md,
    marginTop: espacio.base,
  },

  detalle: {
    alignSelf: 'stretch',
    marginTop: espacio.xl,
    padding: espacio.base,
    borderRadius: radio.lg,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: colors.tarjeta,
    gap: espacio.sm,
  },
  tituloDetalle: {
    ...tipografia.etiqueta,
    color: colors.texto.tenue,
  },
  textoDetalle: {
    ...tipografia.pequeno,
    color: colors.marca.rose,
  },
  pila: {
    ...tipografia.pequeno,
    fontSize: 10,
    lineHeight: 14,
    color: colors.texto.tenue,
  },
});
