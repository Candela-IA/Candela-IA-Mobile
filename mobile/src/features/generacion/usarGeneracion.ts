import { useMutation } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { FuncionApi, generar } from '../../core/api/candela';
import { ErrorApi } from '../../core/api/cliente';
import { useSesion } from '../../core/di/sesion';
import { CapturaSeleccionada } from './ZonaCaptura';

/**
 * Toda la lógica de generar y copiar, fuera de la pantalla.
 *
 * La pantalla queda ocupándose solo de la presentación, y esta lógica se
 * puede probar y reutilizar sin arrastrar la interfaz.
 */

interface Opciones {
  funcion: FuncionApi;
  onSinCreditos: () => void;
}

export function usarGeneracion({ funcion, onSinCreditos }: Opciones) {
  const router = useRouter();
  const { token, actualizarSaldo } = useSesion();

  const [resultado, setResultado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const mutacion = useMutation({
    mutationFn: async (datos: {
      tono: string;
      captura: CapturaSeleccionada | null;
      contexto: string;
      esRegeneracion: boolean;
    }) => {
      if (!token) throw new ErrorApi('DISPOSITIVO_NO_ENCONTRADO', 'Sin sesión.');

      return generar(token, {
        funcion,
        tono: datos.tono,
        imagen: datos.captura
          ? { base64: datos.captura.base64, mimeType: datos.captura.mimeType }
          : undefined,
        contexto: datos.contexto || undefined,
        esRegeneracion: datos.esRegeneracion,
      });
    },

    onSuccess: (respuesta) => {
      setResultado(respuesta.mensaje);
      setCopiado(false);
      // El backend devuelve el saldo ya descontado: así el contador de la
      // cabecera queda al día sin una segunda petición.
      actualizarSaldo(respuesta.saldo);
    },

    onError: (error) => {
      if (error instanceof ErrorApi && error.requierePaywall) {
        onSinCreditos();
        return;
      }

      Alert.alert(
        'No pudimos generar',
        error instanceof Error
          ? error.message
          : 'Algo salió mal. Intenta de nuevo.',
      );
    },
  });

  const copiar = useCallback(async () => {
    if (!resultado) return;

    await Clipboard.setStringAsync(resultado);
    setCopiado(true);

    // El "¡Copiado!" vuelve a su texto original solo. Un aviso que se queda
    // para siempre deja de informar.
    setTimeout(() => setCopiado(false), 2000);
  }, [resultado]);

  const irAlPaywall = useCallback(() => {
    router.push('/premium');
  }, [router]);

  return {
    resultado,
    esEjemplo: resultado === null,
    generando: mutacion.isPending,
    generar: mutacion.mutate,
    copiar,
    copiado,
    irAlPaywall,
  };
}
