import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { usarPreferencias } from '../src/core/di/preferencias';
import { useSesion } from '../src/core/di/sesion';
import { colors } from '../src/core/theme';

/**
 * Raíz de la aplicación.
 *
 * Con Expo Router, cada archivo de `app/` es una ruta y este layout envuelve
 * a todas. Aquí van los proveedores globales y la configuración de navegación.
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Un celular pierde conexión constantemente. Tres reintentos con
      // espera creciente evitan que un túnel del metro rompa la sesión.
      retry: 3,
      retryDelay: (intento) => Math.min(1000 * 2 ** intento, 8000),
      staleTime: 30_000,
    },
    mutations: {
      // Las generaciones NO se reintentan solas: cada intento cuesta un
      // crédito. Si falla, decide el usuario.
      retry: false,
    },
  },
});

export default function LayoutRaiz() {
  const cargarPreferencias = usarPreferencias((estado) => estado.cargar);
  const iniciarSesion = useSesion((estado) => estado.iniciar);

  // Se leen aquí, en la raíz, para que la primera pantalla ya se pinte con
  // los ajustes del usuario. Si se leyeran dentro de cada pantalla, quien
  // apagó las animaciones las vería aparecer y desaparecer al arrancar.
  useEffect(() => {
    void cargarPreferencias();
  }, [cargarPreferencias]);

  // La sesión también arranca aquí, no dentro de las pantallas de generación.
  // El saldo hace falta en Ajustes y en el paywall, y si solo se pidiera al
  // abrir una función, entrar directo a Ajustes mostraría "sin sesión" aunque
  // el backend estuviera corriendo. Es idempotente: llamarla de más no hace
  // una segunda petición.
  useEffect(() => {
    void iniciarSesion();
  }, [iniciarSesion]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.fondo },
            animation: 'fade',
          }}
        >
          {/* El paywall sube desde abajo y tapa la pantalla entera. Se
              declara aquí porque es la única ruta que no usa el fundido
              del resto; las demás se registran solas por su archivo. */}
          <Stack.Screen
            name="premium"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
