import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

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
import { TarjetaGlass } from '../../core/ui/TarjetaGlass';

/**
 * Vista previa de chat para Rompehielos.
 *
 * Muestra el mensaje dentro de una conversación simulada, con el
 * "escribiendo…" de la otra persona debajo. Igual que la vista previa de
 * Instagram en Notas: el usuario ve el mensaje en el contexto donde lo va a
 * usar, no como un texto suelto.
 *
 * El nombre "Ella" es del diseño. Es un marcador genérico: la app no sabe a
 * quién le va a escribir el usuario.
 */

export const ROMPEHIELOS_EJEMPLO =
  'Oye, tu perfil me sacó una sonrisa. ¿Eres igual de interesante en persona? 😏';

export function VistaPreviaChat({
  mensaje,
  etiquetaTono,
  emojiTono,
  esEjemplo,
  tono,
}: {
  mensaje: string;
  etiquetaTono: string;
  emojiTono: string;
  esEjemplo: boolean;
  tono: TonoAcento;
}) {
  const t = TONOS[tono];

  return (
    <TarjetaGlass tono={tono} padding={0} estilo={estilos.tarjeta}>
      {/* Cabecera de la conversación */}
      <View style={estilos.cabecera}>
        <View style={estilos.avatar}>
          <Ionicons name="person" size={16} color={colors.texto.tenue} />
        </View>

        <View style={estilos.datosContacto}>
          <Text style={estilos.nombre}>Ella</Text>
          <View style={estilos.estado}>
            <View style={estilos.puntoVerde} />
            <Text style={estilos.textoEstado}>en línea</Text>
          </View>
        </View>

        <View
          style={[
            estilos.insigniaTono,
            {
              borderColor: `rgba(${t.rgb},0.45)`,
              backgroundColor: `rgba(${t.rgb},0.10)`,
            },
          ]}
        >
          <Text style={[estilos.textoInsignia, { color: t.hex }]}>
            {emojiTono} {etiquetaTono}
          </Text>
        </View>
      </View>

      <View style={estilos.separador} />

      <View style={estilos.conversacion}>
        {esEjemplo ? (
          <View
            style={[
              estilos.insigniaEjemplo,
              {
                borderColor: `rgba(${t.rgb},0.5)`,
                backgroundColor: `rgba(${t.rgb},0.12)`,
              },
            ]}
          >
            <Text style={[estilos.textoEjemplo, { color: t.hex }]}>
              EJEMPLO
            </Text>
          </View>
        ) : null}

        {/* Burbuja del usuario, alineada a la derecha. */}
        <LinearGradient
          colors={degradados.marca}
          start={direccionMarca.start}
          end={direccionMarca.end}
          style={estilos.burbuja}
        >
          <Text style={estilos.textoMensaje}>{mensaje}</Text>
          <View style={estilos.pieBurbuja}>
            <Text style={estilos.hora}>Ahora</Text>
            <Ionicons
              name="checkmark"
              size={12}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        </LinearGradient>

        {/* "Escribiendo…" de la otra persona. */}
        <View style={estilos.escribiendo}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={estilos.puntoEscribiendo} />
          ))}
        </View>
      </View>
    </TarjetaGlass>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { overflow: 'hidden' },

  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    paddingHorizontal: espacio.base,
    paddingVertical: espacio.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.borde,
  },
  datosContacto: { flex: 1 },
  nombre: { ...tipografia.cuerpoFuerte, color: colors.texto.blanco },
  estado: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  puntoVerde: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.estado.exito,
  },
  textoEstado: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: colors.estado.exito,
  },
  insigniaTono: {
    paddingHorizontal: espacio.sm,
    paddingVertical: 4,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: 'rgba(255,45,138,0.45)',
    backgroundColor: 'rgba(255,45,138,0.10)',
  },
  textoInsignia: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: colors.marca.rosa,
  },

  separador: { height: 1, backgroundColor: colors.borde },

  conversacion: {
    padding: espacio.base,
    gap: espacio.md,
    alignItems: 'flex-end',
  },
  insigniaEjemplo: {
    alignSelf: 'center',
    paddingHorizontal: espacio.sm,
    paddingVertical: 3,
    borderRadius: radio.pildora,
    borderWidth: 1,
    borderColor: 'rgba(255,45,138,0.5)',
    backgroundColor: 'rgba(255,45,138,0.12)',
  },
  textoEjemplo: {
    ...tipografia.etiqueta,
    fontSize: 9,
    color: colors.marca.rosa,
  },

  burbuja: {
    maxWidth: '90%',
    paddingHorizontal: espacio.base,
    paddingTop: espacio.md,
    paddingBottom: espacio.sm,
    borderRadius: radio.xl,
    borderBottomRightRadius: radio.xs,
  },
  textoMensaje: {
    ...tipografia.cuerpo,
    color: colors.texto.blanco,
  },
  pieBurbuja: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: espacio.xs,
  },
  hora: {
    ...tipografia.pequeno,
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },

  escribiendo: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: espacio.md,
    paddingVertical: espacio.sm,
    borderRadius: radio.lg,
    borderBottomLeftRadius: radio.xs,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  puntoEscribiendo: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.texto.tenue,
  },
});
