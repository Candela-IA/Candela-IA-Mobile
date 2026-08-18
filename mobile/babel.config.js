module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      /**
       * Reanimated 4 movió su plugin de Babel a `react-native-worklets`.
       * En versiones anteriores era 'react-native-reanimated/plugin' — si
       * copias configuración de un tutorial viejo, falla con un error poco
       * claro sobre worklets.
       *
       * Tiene que ir SIEMPRE al final de la lista de plugins.
       */
      'react-native-worklets/plugin',
    ],
  };
};
