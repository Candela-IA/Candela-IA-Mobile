import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Preferencias, usarPreferencias } from '../src/core/di/preferencias';
import {
  colors,
  espacio,
  radio,
  tipografia,
  TonoAcento,
  TONOS,
} from '../src/core/theme';
import { CabeceraPantalla } from '../src/core/ui/CabeceraPantalla';
import { EtiquetaSeccion } from '../src/core/ui/EtiquetaSeccion';
import { FilaAjuste, SeparadorAjuste } from '../src/core/ui/FilaAjuste';
import { FondoPantalla } from '../src/core/ui/FondoPantalla';
import { IconoDegradado } from '../src/core/ui/IconoDegradado';
import { Interruptor } from '../src/core/ui/Interruptor';
import { TarjetaGlass } from '../src/core/ui/TarjetaGlass';
import { TextoDegradado } from '../src/core/ui/TextoDegradado';

/**
 * AJUSTES → PERSONALIZACIÓN
 *
 * Los tres efectos visuales que el usuario puede apagar. Cada cambio se
 * guarda solo y se nota al instante en toda la app, porque `FondoPantalla`,
 * `TarjetaGlass` e `IconoDegradado` leen estas preferencias directamente.
 *
 * No es solo estética: en un teléfono modesto las auras y las partículas
 * animadas cuestan batería, y quien las apague debe notarlo de verdad.
 */

interface Efecto {
  clave: keyof Preferencias;
  icono: keyof typeof Ionicons.glyphMap;
  tono: TonoAcento;
  titulo: string;
  /**
   * Qué dice la fila en cada estado.
   *
   * El interruptor por sí solo no explica nada: su posición indica que algo
   * está encendido, pero no qué significa que lo esté ni qué se pierde al
   * apagarlo. Con un texto por estado, la fila se explica sola.
   */
  encendido: string;
  apagado: string;
}

const EFECTOS: readonly Efecto[] = [
  {
    clave: 'animacionesFondo',
    icono: 'sparkles',
    tono: 'purpura',
    titulo: 'Animaciones de fondo',
    encendido: 'Auras de color latiendo detrás del contenido',
    apagado: 'Fondo quieto, sin auras en movimiento',
  },
  {
    clave: 'particulasFlotantes',
    icono: 'flash',
    tono: 'cian',
    titulo: 'Partículas flotantes',
    encendido: 'Destellos subiendo despacio por la pantalla',
    apagado: 'Pantalla limpia, sin destellos',
  },
  {
    clave: 'brilloNeon',
    icono: 'color-wand',
    tono: 'rosa',
    titulo: 'Brillo neón',
    encendido: 'Resplandor de color en iconos y tarjetas',
    apagado: 'Iconos y tarjetas sin resplandor',
  },
];

export default function Personalizacion() {
  const preferencias = usarPreferencias();

  return (
    <FondoPantalla>
      <CabeceraPantalla titulo="Personalización" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.scroll}
      >
        <View style={estilos.intro}>
          <IconoDegradado nombre="brush" tono="ambar" tamano={52} radio={18} />

          <View style={estilos.titulo}>
            <Text style={estilos.textoTitulo}>Ajusta Candela a</Text>
            <TextoDegradado estilo={estilos.textoTitulo}>
              tu gusto
            </TextoDegradado>
          </View>

          <Text style={estilos.descripcion}>
            Personaliza el estilo visual de la app.
          </Text>
        </View>

        <EtiquetaSeccion icono="color-palette" tono="ambar">
          Estilo visual
        </EtiquetaSeccion>

        <TarjetaGlass tono="purpura" padding={0}>
          {EFECTOS.map((efecto, indice) => (
            <View key={efecto.clave}>
              <FilaAjuste
                compacta
                icono={efecto.icono}
                tono={efecto.tono}
                // Apagado, el icono se atenúa: el estado se ve de un vistazo
                // sin tener que leer, y sin sacar un gris del sistema de
                // tonos, que son los seis colores de marca a propósito.
                atenuada={!preferencias[efecto.clave]}
                titulo={efecto.titulo}
                subtitulo={
                  preferencias[efecto.clave] ? efecto.encendido : efecto.apagado
                }
                derecha={
                  <Interruptor
                    valor={preferencias[efecto.clave]}
                    onCambiar={() => preferencias.alternar(efecto.clave)}
                    etiqueta={efecto.titulo}
                  />
                }
              />
              {indice < EFECTOS.length - 1 ? <SeparadorAjuste /> : null}
            </View>
          ))}
        </TarjetaGlass>

        <Consejo>
          <Text style={estilos.consejoFuerte}>Consejo:</Text> desactiva las
          animaciones si prefieres una experiencia más sobria o quieres ahorrar
          batería.
        </Consejo>
      </ScrollView>
    </FondoPantalla>
  );
}

function Consejo({ children }: { children: ReactNode }) {
  return (
    <View style={estilos.consejo}>
      <Ionicons
        name="bulb"
        size={15}
        color={TONOS.ambar.hex}
        style={estilos.iconoConsejo}
      />
      <Text style={estilos.textoConsejo}>{children}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    paddingHorizontal: espacio.lg,
    paddingBottom: espacio.xxl,
  },

  intro: { marginBottom: espacio.xl },
  titulo: { marginTop: espacio.base },
  textoTitulo: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.texto.blanco,
  },
  descripcion: {
    ...tipografia.pequeno,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },

  consejo: {
    flexDirection: 'row',
    gap: espacio.md,
    marginTop: espacio.lg,
    padding: espacio.base,
    borderRadius: radio.lg,
    borderWidth: 1,
    borderColor: `rgba(${TONOS.ambar.rgb},0.28)`,
    backgroundColor: `rgba(${TONOS.ambar.rgb},0.07)`,
  },
  iconoConsejo: { marginTop: 2 },
  textoConsejo: {
    ...tipografia.pequeno,
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 19,
  },
  consejoFuerte: { color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
});
