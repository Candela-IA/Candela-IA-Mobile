import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { entrarAlPanel } from '../../src/core/api/admin';
import { ErrorApi } from '../../src/core/api/cliente';
import { colors, espacio, radio, tipografia } from '../../src/core/theme';
import { BotonDegradado } from '../../src/core/ui/BotonDegradado';
import { BotonFantasma } from '../../src/core/ui/BotonFantasma';
import { CabeceraPantalla } from '../../src/core/ui/CabeceraPantalla';
import { EtiquetaSeccion } from '../../src/core/ui/EtiquetaSeccion';
import { FilaAjuste, SeparadorAjuste } from '../../src/core/ui/FilaAjuste';
import { FondoPantalla } from '../../src/core/ui/FondoPantalla';
import { IconoDegradado } from '../../src/core/ui/IconoDegradado';
import { TarjetaGlass } from '../../src/core/ui/TarjetaGlass';
import { aspectoDe } from '../../src/features/admin/aspecto';
import { usarSesionAdmin } from '../../src/features/admin/sesionAdmin';
import { usarPanel } from '../../src/features/admin/usarPanel';

/**
 * AJUSTES → ENTRENAR A LA IA (candado)
 *
 * Sin sesión, pide la contraseña de administrador. Con sesión, las cuatro
 * funciones, y desde cada una sus modos de respuesta.
 *
 * Todo lo que se cambia aquí afecta a TODOS los usuarios de la app, por eso
 * va detrás de una contraseña que solo tiene el cliente y que vive en el
 * servidor, no en la app.
 */
export default function EntrenarIa() {
  const token = usarSesionAdmin((estado) => estado.token);

  return (
    <FondoPantalla>
      <CabeceraPantalla titulo="Entrenar a la IA" />
      {token ? <Secciones /> : <Candado />}
    </FondoPantalla>
  );
}

function Candado() {
  const abrir = usarSesionAdmin((estado) => estado.abrir);

  const [contrasena, setContrasena] = useState('');
  const [visible, setVisible] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entrar = async () => {
    if (!contrasena || entrando) return;
    setEntrando(true);
    setError(null);

    try {
      const { token } = await entrarAlPanel(contrasena);
      setContrasena('');
      abrir(token);
    } catch (e) {
      setError(
        e instanceof ErrorApi
          ? e.estado === 429
            ? 'Demasiados intentos. Espera unos minutos y vuelve a probar.'
            : e.message
          : 'No pudimos entrar. Intenta de nuevo.',
      );
    } finally {
      setEntrando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.intro}>
          <IconoDegradado nombre="lock-closed" tono="purpura" tamano={56} radio={18} />
          <Text style={estilos.titulo}>Solo para administradores</Text>
          <Text style={estilos.descripcion}>
            Aquí se cambia cómo responde la IA en cada modo, para todos los
            usuarios de la app. Escribe la contraseña de administrador para
            continuar.
          </Text>
        </View>

        <View style={[estilos.campo, error ? estilos.campoError : null]}>
          <Ionicons name="key" size={16} color={colors.texto.tenue} />
          <TextInput
            value={contrasena}
            onChangeText={(texto) => {
              setContrasena(texto);
              setError(null);
            }}
            placeholder="Contraseña"
            placeholderTextColor={colors.texto.tenue}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="go"
            onSubmitEditing={() => void entrar()}
            style={estilos.entrada}
          />
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Ionicons
              name={visible ? 'eye-off' : 'eye'}
              size={18}
              color={colors.texto.suave}
            />
          </Pressable>
        </View>

        {error ? <Text style={estilos.textoError}>{error}</Text> : null}

        <BotonDegradado
          titulo="Entrar"
          onPress={() => void entrar()}
          deshabilitado={!contrasena}
          cargando={entrando}
          iconoIzquierda={
            <Ionicons name="lock-open" size={16} color={colors.texto.blanco} />
          }
          estilo={estilos.boton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Secciones() {
  const router = useRouter();
  const cerrar = usarSesionAdmin((estado) => estado.cerrar);
  const panel = usarPanel();

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <TarjetaGlass tono="purpura" estilo={estilos.aviso}>
        <Text style={estilos.textoAviso}>
          Elige una sección y luego el modo que quieres cambiar. Lo que
          guardes se aplica a todos los usuarios desde la siguiente respuesta.
          Las reglas de fondo —ortografía, respeto, no insistir— no se tocan.
        </Text>
      </TarjetaGlass>

      <EtiquetaSeccion icono="sparkles" tono="rosa">
        Secciones
      </EtiquetaSeccion>

      {panel.isPending ? (
        <ActivityIndicator color={colors.marca.rosa} style={estilos.cargando} />
      ) : panel.isError ? (
        <TarjetaGlass tono="rose">
          <Text style={estilos.textoAviso}>
            No pudimos cargar los modos. Revisa tu conexión.
          </Text>
          <BotonFantasma
            titulo="Reintentar"
            onPress={() => void panel.refetch()}
            estilo={estilos.reintentar}
          />
        </TarjetaGlass>
      ) : (
        <TarjetaGlass tono="purpura" padding={0}>
          {panel.data.funciones.map((funcion, indice) => {
            const editados = funcion.tonos.filter((t) => t.editado).length;
            const aspecto = aspectoDe(funcion.id);

            return (
              <View key={funcion.id}>
                <FilaAjuste
                  compacta
                  icono={aspecto.icono}
                  tono={aspecto.tono}
                  titulo={funcion.etiqueta}
                  subtitulo={
                    `${funcion.tonos.length} modos` +
                    (editados > 0
                      ? ` · ${editados} ${editados === 1 ? 'editado' : 'editados'}`
                      : ' · todos originales')
                  }
                  onPress={() =>
                    router.push({
                      pathname: '/entrenar-ia/[funcion]',
                      params: { funcion: funcion.id },
                    })
                  }
                />
                {indice < panel.data.funciones.length - 1 ? (
                  <SeparadorAjuste />
                ) : null}
              </View>
            );
          })}
        </TarjetaGlass>
      )}

      <BotonFantasma
        titulo="Cerrar sesión del panel"
        onPress={cerrar}
        iconoIzquierda={
          <Ionicons name="log-out-outline" size={16} color={colors.texto.claro} />
        }
        estilo={estilos.cerrar}
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: espacio.lg, paddingBottom: espacio.xxl },

  intro: { alignItems: 'center', marginTop: espacio.lg, marginBottom: espacio.xl },
  titulo: {
    ...tipografia.subtitulo,
    color: colors.texto.blanco,
    marginTop: espacio.base,
    textAlign: 'center',
  },
  descripcion: {
    ...tipografia.cuerpo,
    color: colors.texto.suave,
    marginTop: espacio.sm,
    textAlign: 'center',
  },

  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.sm,
    minHeight: 52,
    paddingHorizontal: espacio.base,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  campoError: { borderColor: 'rgba(255,45,138,0.6)' },
  entrada: {
    flex: 1,
    ...tipografia.cuerpo,
    color: colors.texto.blanco,
    paddingVertical: espacio.md,
  },
  textoError: {
    ...tipografia.pequeno,
    color: colors.marca.rosa,
    marginTop: espacio.sm,
  },
  boton: { marginTop: espacio.lg },

  aviso: { marginTop: espacio.sm, marginBottom: espacio.xl },
  textoAviso: { ...tipografia.pequeno, color: colors.texto.claro },
  cargando: { marginVertical: espacio.xl },
  reintentar: { marginTop: espacio.md },
  cerrar: { marginTop: espacio.xl },
});
