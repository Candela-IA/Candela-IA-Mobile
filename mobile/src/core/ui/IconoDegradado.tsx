import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';

import { usarPreferencias } from '../di/preferencias';
import { colors, TonoAcento, TONOS } from '../theme';

interface Props {
  nombre: keyof typeof Ionicons.glyphMap;
  tono: TonoAcento;
  /** 48 en las tarjetas, 28 en las etiquetas de sección. */
  tamano?: number;
  radio?: number;
  /**
   * `true` (por defecto) pinta el degradado saturado del tono, como en el
   * Home, el paywall y Ajustes.
   *
   * `false` da la variante de la bienvenida: un tinte translúcido del color
   * que muere en negro, con el borde encendido. Ahí los iconos acompañan a
   * un texto largo, y en sólido pesarían más que lo que hay que leer.
   */
  solido?: boolean;
}

/**
 * Capas del resplandor, de fuera hacia dentro.
 *
 * `crece` es cuánto sobresale por cada lado respecto al icono, en
 * proporción a su tamaño; así el halo se ve igual en un icono de 28 que en
 * uno de 52.
 *
 * Se apilan varias con opacidad muy baja en vez de usar una sola grande:
 * una capa única deja un canto duro visible, y superponerlas hace que la
 * opacidad se acumule hacia el centro y se desvanezca hacia fuera, que es
 * lo que hace un desenfoque de verdad.
 */
const CAPAS_RESPLANDOR = [
  { crece: 0.22, opacidad: 0.05 },
  { crece: 0.15, opacidad: 0.06 },
  { crece: 0.09, opacidad: 0.07 },
  { crece: 0.04, opacidad: 0.08 },
];

/**
 * El halo no puede crecer más que el margen de las tarjetas que lo
 * contienen: `TarjetaGlass` recorta su contenido, y un resplandor que llega
 * al borde se corta en seco y se ve como una raya. Con 0.22 sobre un icono
 * de 44 son ~10px, holgado dentro de los 16 de margen.
 */

/**
 * El cuadradito con degradado que acompaña cada opción del diseño.
 *
 * Medidas tomadas del prototipo (`GlowIcon`): 48px, radio 16, degradado a
 * 145° de `from` a `to`, y resplandor de color alrededor.
 *
 * Recibe el nombre del tono, no un color libre: así solo se pueden usar los
 * seis de la marca y el tipado impide inventar uno nuevo.
 */
export function IconoDegradado({
  nombre,
  tono,
  tamano = 48,
  radio = 16,
  solido = true,
}: Props) {
  const t = TONOS[tono];
  // Ajustes → Personalización → "Brillo neón".
  const brillo = usarPreferencias((estado) => estado.brilloNeon);

  return (
    // Envoltura sin recorte: el resplandor tiene que poder salirse del
    // cuadrado del icono. El recorte vive en la capa de dentro, que es la
    // que necesita esquinas limpias para el degradado.
    <View style={{ width: tamano, height: tamano }}>
      {brillo ? <Resplandor color={t.rgb} tamano={tamano} radio={radio} /> : null}

      <View
        style={[
          estilos.cuadro,
          { borderRadius: radio },
          brillo
            ? Platform.select({
                // En iOS la sombra sí admite color, así que ahí el halo sale
                // gratis y bien hecho. Las capas de abajo son sobre todo
                // para Android, donde `elevation` solo pinta gris.
                ios: {
                  shadowColor: t.hex,
                  shadowOpacity: 0.62,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                },
              })
            : null,
        ]}
      >
        <LinearGradient
          colors={
            solido
              ? [t.from, t.to]
              : [`rgba(${t.rgb},0.20)`, colors.oscuro.grafito]
          }
          // 145° del diseño.
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Borde interior claro: el `inset 0 0 0 1px rgba(255,255,255,0.10)`
            del prototipo, que en React Native se hace con una capa encima. */}
        <View
          style={[
            estilos.brilloInterior,
            {
              borderRadius: radio,
              borderColor: solido
                ? 'rgba(255,255,255,0.10)'
                : `rgba(${t.rgb},0.45)`,
            },
          ]}
          pointerEvents="none"
        />
        <Ionicons
          name={nombre}
          size={Math.round(tamano * 0.46)}
          color={colors.texto.blanco}
        />
      </View>
    </View>
  );
}

/**
 * El halo de color detrás del icono.
 *
 * React Native no tiene `box-shadow` con color en Android —`elevation` solo
 * pinta una sombra gris—, así que el resplandor del diseño se construye a
 * mano: cuadrados concéntricos del color del tono, cada uno un poco mayor y
 * casi transparente.
 */
function Resplandor({
  color,
  tamano,
  radio,
}: {
  color: string;
  tamano: number;
  radio: number;
}) {
  return (
    <View style={estilos.grupoResplandor} pointerEvents="none">
      {CAPAS_RESPLANDOR.map((capa) => {
        const margen = tamano * capa.crece;

        return (
          <View
            key={capa.crece}
            style={{
              position: 'absolute',
              top: -margen,
              left: -margen,
              right: -margen,
              bottom: -margen,
              borderRadius: radio + margen,
              backgroundColor: `rgba(${color},${capa.opacidad})`,
            }}
          />
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  cuadro: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grupoResplandor: { ...StyleSheet.absoluteFillObject },
  brilloInterior: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
});
