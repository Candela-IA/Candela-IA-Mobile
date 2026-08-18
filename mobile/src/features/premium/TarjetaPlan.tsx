import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import {
  colors,
  espacio,
  radio,
  tipografia,
  TONOS,
} from '../../core/theme';
import { IconoDegradado } from '../../core/ui/IconoDegradado';
import { TarjetaGlass } from '../../core/ui/TarjetaGlass';
import {
  formatearPrecio,
  Plan,
  porcentajeAhorro,
  precioComparado,
} from './planes';

interface Props {
  plan: Plan;
  seleccionado: boolean;
  onSeleccionar: () => void;
}

/**
 * Una tarjeta de plan del paywall.
 *
 * Reparte el ancho en dos: los beneficios a la izquierda y el precio a la
 * derecha, como el diseño. Es lo que permite que la tarjeta anual muestre
 * cuatro líneas y el precio sin quedar altísima.
 *
 * La insignia "MÁS POPULAR" va fuera de `TarjetaGlass` a propósito: la
 * tarjeta recorta su contenido (`overflow: 'hidden'`) para que el degradado
 * respete las esquinas, así que una insignia dentro quedaría cortada por el
 * borde superior en vez de montarse encima.
 */
export function TarjetaPlan({ plan, seleccionado, onSeleccionar }: Props) {
  const ahorro = porcentajeAhorro(plan);
  const comparado = precioComparado(plan);
  const acento = TONOS[plan.tono];

  // La línea del ahorro encabeza la lista, pero solo si hay ahorro real.
  const ventajas = ahorro
    ? [`Ahorra ${ahorro}% comparado al plan semanal`, ...plan.ventajas]
    : plan.ventajas;

  return (
    <View style={estilos.envoltura}>
      <TarjetaGlass
        tono={plan.tono}
        activa={seleccionado}
        onPress={onSeleccionar}
        intensidad={plan.destacado ? 0.3 : 0.2}
        padding={espacio.base + 2}
      >
        {/* ── Encabezado ───────────────────────────────────────────── */}
        <View style={estilos.encabezado}>
          <IconoDegradado
            nombre={plan.icono}
            tono={plan.tono}
            tamano={44}
            radio={14}
          />

          <View style={estilos.identidad}>
            <Text style={estilos.nombre}>
              {plan.etiqueta}
              {plan.adorno ? ` ${plan.adorno}` : ''}
            </Text>
            <Text style={estilos.subtitulo}>{plan.subtitulo}</Text>
          </View>

          <Marca seleccionado={seleccionado} />
        </View>

        {/* ── Beneficios y precio ──────────────────────────────────── */}
        <View style={estilos.cuerpo}>
          <View style={estilos.ventajas}>
            {ventajas.map((texto) => (
              <View key={texto} style={estilos.filaVentaja}>
                <Ionicons name="checkmark" size={13} color={acento.hex} />
                <Text style={estilos.textoVentaja}>{texto}</Text>
              </View>
            ))}
          </View>

          <View style={estilos.bloquePrecio}>
            {ahorro ? (
              <View style={[estilos.pildoraAhorro, { backgroundColor: acento.hex }]}>
                <Text style={estilos.textoAhorro}>AHORRA {ahorro}%</Text>
              </View>
            ) : null}

            <View style={estilos.precio}>
              <Text style={estilos.moneda}>US$</Text>
              <Text style={estilos.monto}>{formatearPrecio(plan.precio)}</Text>
            </View>

            <Text style={estilos.periodo}>{plan.periodo}</Text>

            {comparado !== null ? (
              <Text style={estilos.tachado}>
                US$ {formatearPrecio(comparado)}
              </Text>
            ) : null}
          </View>
        </View>
      </TarjetaGlass>

      {plan.destacado ? <Insignia /> : null}
    </View>
  );
}

// ── Piezas ────────────────────────────────────────────────────────────────

/** El círculo de selección de la esquina superior derecha. */
function Marca({ seleccionado }: { seleccionado: boolean }) {
  if (!seleccionado) return <View style={estilos.marcaVacia} />;

  return (
    <View style={estilos.marcaLlena}>
      <Ionicons name="checkmark" size={13} color={colors.texto.blanco} />
    </View>
  );
}

function Insignia() {
  return (
    <View style={estilos.insignia} pointerEvents="none">
      <Text style={estilos.textoInsignia}>🔥 MÁS POPULAR</Text>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // Deja aire arriba para que la insignia se monte sobre el borde sin
  // pisar la tarjeta anterior.
  envoltura: { paddingTop: espacio.md },

  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
  },
  identidad: { flex: 1 },
  nombre: {
    ...tipografia.subtitulo,
    color: colors.texto.blanco,
  },
  subtitulo: {
    ...tipografia.pequeno,
    color: colors.texto.suave,
    marginTop: 2,
  },

  marcaVacia: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  marcaLlena: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.marca.purpura,
  },

  cuerpo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    marginTop: espacio.base,
  },
  ventajas: { flex: 1, gap: 7 },
  filaVentaja: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.sm,
  },
  textoVentaja: {
    ...tipografia.pequeno,
    flex: 1,
    color: colors.texto.claro,
    lineHeight: 17,
  },

  bloquePrecio: { alignItems: 'flex-end', gap: 2 },
  pildoraAhorro: {
    paddingHorizontal: espacio.md,
    paddingVertical: 4,
    borderRadius: radio.pildora,
    marginBottom: espacio.xs,
  },
  textoAhorro: {
    ...tipografia.etiqueta,
    fontSize: 10,
    color: colors.texto.blanco,
  },
  precio: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
  },
  moneda: {
    ...tipografia.pequeno,
    color: colors.texto.claro,
    marginTop: 5,
  },
  monto: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.texto.blanco,
  },
  periodo: { ...tipografia.pequeno, color: colors.texto.suave },
  tachado: {
    ...tipografia.pequeno,
    fontSize: 12,
    color: colors.texto.tenue,
    textDecorationLine: 'line-through',
  },

  insignia: {
    position: 'absolute',
    top: 0,
    left: espacio.lg,
    paddingHorizontal: espacio.md,
    paddingVertical: 5,
    borderRadius: radio.pildora,
    backgroundColor: colors.marca.rosa,
  },
  textoInsignia: {
    ...tipografia.etiqueta,
    fontSize: 10,
    color: colors.texto.blanco,
  },
});
