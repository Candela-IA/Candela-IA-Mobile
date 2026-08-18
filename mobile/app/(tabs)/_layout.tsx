import { Tabs } from 'expo-router';

import { BarraInferior } from '../../src/core/ui/BarraInferior';

/**
 * Las dos pestañas del diseño: Inicio y Ajustes.
 *
 * La barra por defecto se reemplaza por `BarraInferior` para reproducir la
 * forma flotante con márgenes y esquinas redondeadas del prototipo.
 */
export default function LayoutTabs() {
  return (
    <Tabs
      tabBar={(props) => <BarraInferior {...props} />}
      screenOptions={{
        headerShown: false,
        // El fondo lo pinta cada pantalla con FondoPantalla; si aquí
        // pusiéramos color, taparía las auras.
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
