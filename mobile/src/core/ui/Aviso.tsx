import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { create } from 'zustand';

import { colors, espacio, tipografia, TonoAcento } from '../theme';
import { BotonDegradado } from './BotonDegradado';
import { TarjetaGlass } from './TarjetaGlass';

/**
 * EL AVISO DE LA APP.
 *
 * Sustituye a `Alert.alert`, que pinta el diálogo del sistema: blanco, con su
 * tipografía y su "OK" en verde azulado, en medio de una app negra con neón.
 * React Native no deja estilarlo —no hay API para eso—, así que la única
 * forma de que un error se vea como parte de Candela es dejar de pedírselo a
 * Android y dibujarlo nosotros.
 *
 * Vive en `core/ui` y no en una pantalla porque los avisos salen desde
 * sitios que no son pantallas: el cliente HTTP, el selector de fotos, los
 * enlaces legales. Por eso el estado va en una tienda y se puede disparar
 * desde cualquier función, con o sin React delante.
 */

interface Contenido {
  readonly titulo: string;
  readonly mensaje: string;
  /** Con qué acento de la marca se pinta el borde y el resplandor. */
  readonly tono: TonoAcento;
}

interface EstadoAviso {
  readonly actual: Contenido | null;
  mostrar: (contenido: Contenido) => void;
  cerrar: () => void;
}

const usarAviso = create<EstadoAviso>((set) => ({
  actual: null,
  mostrar: (actual) => set({ actual }),
  cerrar: () => set({ actual: null }),
}));

/**
 * Muestra un aviso desde donde sea.
 *
 * Se llama igual que se llamaba a `Alert.alert`, para que cambiar los sitios
 * de uso fuera una línea cada uno:
 *
 *   Alert.alert('Título', 'Mensaje')  →  mostrarAviso('Título', 'Mensaje')
 */
export function mostrarAviso(
  titulo: string,
  mensaje: string,
  tono: TonoAcento = 'rosa',
): void {
  usarAviso.getState().mostrar({ titulo, mensaje, tono });
}

/**
 * El diálogo. Va montado una sola vez, en el layout raíz.
 *
 * Uno solo para toda la app y no uno por pantalla: así un aviso disparado
 * desde el cliente HTTP aparece igual esté donde esté el usuario, y nunca se
 * pueden apilar dos.
 */
export function Aviso() {
  const actual = usarAviso((estado) => estado.actual);
  const cerrar = usarAviso((estado) => estado.cerrar);

  return (
    <Modal
      visible={actual !== null}
      transparent
      animationType="fade"
      // El botón físico de atrás en Android tiene que cerrarlo. Sin esto, el
      // sistema lo ignora y el aviso se queda pegado.
      onRequestClose={cerrar}
      statusBarTranslucent
    >
      {/* Tocar fuera cierra, como en el diálogo del sistema. */}
      <Pressable style={estilos.fondo} onPress={cerrar}>
        {/* Este Pressable se come el toque para que tocar DENTRO de la
            tarjeta no la cierre. Sin él, pulsar el propio texto la cerraría. */}
        <Pressable style={estilos.centro} onPress={() => {}}>
          {actual ? (
            <TarjetaGlass
              tono={actual.tono}
              resplandor
              padding={espacio.lg}
              estilo={estilos.tarjeta}
            >
              <Text
                style={estilos.titulo}
                accessibilityRole="header"
                // El sistema anuncia el aviso al abrirse; sin esto, quien usa
                // lector de pantalla no se entera de que apareció.
                accessibilityLiveRegion="polite"
              >
                {actual.titulo}
              </Text>

              <Text style={estilos.mensaje}>{actual.mensaje}</Text>

              <BotonDegradado
                titulo="Entendido"
                onPress={cerrar}
                estilo={estilos.boton}
              />
            </TarjetaGlass>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    // Más oscuro que el velo de una pantalla normal: el aviso interrumpe, y
    // el fondo tiene que dejar de competir por la atención.
    backgroundColor: 'rgba(3,3,6,0.82)',
    justifyContent: 'center',
    paddingHorizontal: espacio.lg,
  },
  centro: { width: '100%' },
  tarjeta: {
    // Ancho tope para que en tablet no se estire de lado a lado.
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  titulo: {
    ...tipografia.subtitulo,
    color: colors.texto.blanco,
    marginBottom: espacio.sm,
  },
  mensaje: {
    ...tipografia.cuerpo,
    color: colors.texto.claro,
    marginBottom: espacio.lg,
  },
  boton: { marginTop: 0 },
});
