import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
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
import { TextoDegradado } from '../../core/ui/TextoDegradado';

/**
 * El checklist que aparece mientras la IA trabaja.
 *
 * HONESTIDAD SOBRE ESTA ANIMACIÓN: la API no reporta progreso por etapas —
 * es una sola llamada. Los tres primeros pasos avanzan por tiempo, no por
 * hechos reales.
 *
 * No es un engaño gratuito: los 3-6 segundos de espera se sienten mucho
 * más cortos cuando algo se mueve, y los pasos describen de verdad lo que
 * el modelo está haciendo por dentro. Lo que no hacemos es afirmar que
 * terminó algo que no terminó: el último paso se marca solo cuando llega
 * la respuesta.
 */

interface Paso {
  texto: string;
  /** Cuándo se marca, en milisegundos desde que empieza. */
  enMs: number;
}

const PASOS_CON_IMAGEN: Paso[] = [
  { texto: 'Leyendo la captura', enMs: 600 },
  { texto: 'Entendiendo el contexto', enMs: 1600 },
  { texto: 'Detectando el tono', enMs: 2600 },
  { texto: 'Redactando tu respuesta', enMs: Infinity },
];

const PASOS_SIN_IMAGEN: Paso[] = [
  { texto: 'Pensando el enfoque', enMs: 700 },
  { texto: 'Ajustando el tono', enMs: 1700 },
  { texto: 'Escribiendo', enMs: Infinity },
];

export function ChecklistCarga({
  conImagen,
  desnudo = false,
}: {
  conImagen: boolean;
  /** Sin tarjeta ni título: solo los pasos. */
  desnudo?: boolean;
}) {
  const pasos = conImagen ? PASOS_CON_IMAGEN : PASOS_SIN_IMAGEN;
  const [completados, setCompletados] = useState(0);

  useEffect(() => {
    const temporizadores = pasos
      .filter((p) => Number.isFinite(p.enMs))
      .map((paso, i) =>
        setTimeout(() => setCompletados(i + 1), paso.enMs),
      );

    return () => temporizadores.forEach(clearTimeout);
  }, [pasos]);

  const lista = (
    <View style={[estilos.lista, desnudo && estilos.listaDesnuda]}>
        {pasos.map((paso, i) => {
          const listo = i < completados;
          const activo = i === completados;

          return (
            <View
              key={paso.texto}
              style={[estilos.fila, activo && estilos.filaActiva]}
            >
              {listo ? (
                <LinearGradient
                  colors={degradados.marca}
                  start={direccionMarca.start}
                  end={direccionMarca.end}
                  style={estilos.casilla}
                >
                  <Ionicons
                    name="checkmark"
                    size={13}
                    color={colors.texto.blanco}
                  />
                </LinearGradient>
              ) : (
                <View
                  style={[
                    estilos.casilla,
                    estilos.casillaVacia,
                    activo && estilos.casillaActiva,
                  ]}
                >
                  {activo ? (
                    <Ionicons
                      name="sparkles"
                      size={12}
                      color={colors.marca.purpura}
                    />
                  ) : null}
                </View>
              )}

              <Text
                style={[
                  estilos.textoPaso,
                  !listo && !activo && estilos.textoPendiente,
                ]}
              >
                {paso.texto}
              </Text>
            </View>
          );
        })}
    </View>
  );

  // Desnudo cuando la pantalla ya pone su propio título: repetirlo dentro de
  // una tarjeta dejaba dos encabezados diciendo lo mismo, y la tarjeta
  // sumaba un alto que en pantallas cortas cortaba el último paso.
  if (desnudo) return lista;

  return (
    <TarjetaGlass tono="purpura" estilo={estilos.tarjeta}>
      <TextoDegradado estilo={estilos.titulo}>
        Candela IA está trabajando
      </TextoDegradado>
      {lista}
    </TarjetaGlass>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { paddingVertical: espacio.xl },
  titulo: {
    ...tipografia.cuerpoFuerte,
    textAlign: 'center',
    marginBottom: espacio.lg,
  },
  lista: { gap: espacio.md },
  /**
   * Fuera de la tarjeta hay que dar ancho a mano.
   *
   * El texto de cada paso va con `flex: 1` para poder partirse en dos
   * líneas. Dentro de la tarjeta hereda su ancho, pero suelto en un
   * contenedor centrado —que encoge hasta el contenido— ese `flex: 1` se
   * resuelve a cero y el texto desaparece dejando solo las casillas.
   */
  listaDesnuda: { alignSelf: 'stretch', maxWidth: 300, width: '100%' },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    paddingHorizontal: espacio.md,
    paddingVertical: espacio.sm,
    borderRadius: radio.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filaActiva: {
    borderColor: 'rgba(168,85,247,0.4)',
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  casilla: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaVacia: {
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  casillaActiva: { borderColor: 'rgba(168,85,247,0.6)' },
  textoPaso: {
    ...tipografia.cuerpo,
    fontSize: 14,
    color: colors.texto.claro,
    flex: 1,
  },
  textoPendiente: { color: colors.texto.tenue },
});
