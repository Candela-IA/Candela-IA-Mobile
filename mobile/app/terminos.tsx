import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { contactarSoporte } from '../src/core/legal';
import { colors, espacio, tipografia, TONOS } from '../src/core/theme';
import { CabeceraPantalla } from '../src/core/ui/CabeceraPantalla';
import { FondoPantalla } from '../src/core/ui/FondoPantalla';
import { IconoDegradado } from '../src/core/ui/IconoDegradado';
import { TarjetaGlass } from '../src/core/ui/TarjetaGlass';
import { TextoDegradado } from '../src/core/ui/TextoDegradado';
import { FilaAjuste } from '../src/core/ui/FilaAjuste';
import {
  Bloque,
  CORREO_SOPORTE,
  INTRODUCCION,
  SECCIONES,
  SeccionTerminos,
  VERSION_TERMINOS,
} from '../src/features/legal/terminos';

/**
 * TÉRMINOS DE USO
 *
 * Se abre desde Ajustes y desde el paywall. Que vivan dentro de la app y no
 * solo en una URL importa: las tiendas exigen que el usuario pueda leerlos
 * antes de comprar, y un enlace externo depende de que haya conexión y de
 * que el sitio siga en pie.
 */
export default function Terminos() {
  return (
    <FondoPantalla>
      <CabeceraPantalla
        titulo="Términos de Uso"
        icono={
          <Ionicons
            name="document-text"
            size={16}
            color={colors.marca.rosa}
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.scroll}
      >
        {/* ── Portada ──────────────────────────────────────────────── */}
        <TarjetaGlass tono="purpura" padding={espacio.base}>
          <View style={estilos.filaPortada}>
            <IconoDegradado
              nombre="document-text"
              tono="purpura"
              tamano={44}
              radio={14}
            />
            <View style={estilos.textosPortada}>
              <TextoDegradado estilo={estilos.tituloPortada}>
                Términos de Uso y Condiciones
              </TextoDegradado>
              <Text style={estilos.version}>
                Última actualización: versión {VERSION_TERMINOS}
              </Text>
            </View>
          </View>
          <Text style={estilos.introduccion}>{INTRODUCCION}</Text>
        </TarjetaGlass>

        {/* ── Secciones ────────────────────────────────────────────── */}
        {SECCIONES.map((seccion) => (
          <Seccion key={seccion.numero} seccion={seccion} />
        ))}

        {/* ── Contacto ─────────────────────────────────────────────── */}
        <TarjetaGlass tono="rosa" padding={0} estilo={estilos.contacto}>
          <FilaAjuste
            icono="mail"
            tono="rosa"
            titulo="Contacto"
            subtitulo={CORREO_SOPORTE}
            onPress={() => void contactarSoporte()}
          />
        </TarjetaGlass>

        <Text style={estilos.pie}>© 2026 Candela IA · Enciende el interés</Text>
      </ScrollView>
    </FondoPantalla>
  );
}

// ── Piezas ────────────────────────────────────────────────────────────────

function Seccion({ seccion }: { seccion: SeccionTerminos }) {
  return (
    <View style={estilos.seccion}>
      <View style={estilos.encabezado}>
        <IconoDegradado
          nombre={seccion.icono}
          tono={seccion.tono}
          tamano={30}
          radio={11}
        />
        <Text style={estilos.tituloSeccion}>
          <Text style={estilos.numero}>{seccion.numero}. </Text>
          {seccion.titulo}
        </Text>
      </View>

      <View style={estilos.cuerpo}>
        {seccion.bloques.map((bloque, indice) => (
          <BloqueTexto key={indice} bloque={bloque} tono={seccion.tono} />
        ))}
      </View>
    </View>
  );
}

function BloqueTexto({
  bloque,
  tono,
}: {
  bloque: Bloque;
  tono: SeccionTerminos['tono'];
}) {
  if ('p' in bloque) return <Text style={estilos.parrafo}>{bloque.p}</Text>;

  return (
    <View style={estilos.item}>
      <Text style={[estilos.guion, { color: TONOS[tono].hex }]}>—</Text>
      <Text style={estilos.parrafo}>{bloque.item}</Text>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  scroll: {
    paddingHorizontal: espacio.lg,
    paddingBottom: espacio.xxl,
    gap: espacio.xl,
  },

  filaPortada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
  },
  textosPortada: { flex: 1 },
  tituloPortada: { ...tipografia.cuerpoFuerte },
  version: {
    ...tipografia.pequeno,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  introduccion: {
    ...tipografia.pequeno,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 21,
    marginTop: espacio.md,
  },

  seccion: { gap: espacio.md },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.sm + 2,
  },
  tituloSeccion: {
    ...tipografia.cuerpoFuerte,
    flex: 1,
    color: colors.texto.blanco,
  },
  numero: { color: 'rgba(255,255,255,0.35)' },

  cuerpo: { gap: espacio.sm, paddingLeft: 2 },
  parrafo: {
    ...tipografia.pequeno,
    flex: 1,
    color: 'rgba(255,255,255,0.62)',
    lineHeight: 21,
  },
  item: { flexDirection: 'row', gap: espacio.sm },
  guion: { ...tipografia.pequeno, lineHeight: 21 },

  contacto: { marginTop: espacio.sm },
  pie: {
    ...tipografia.pequeno,
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
});
