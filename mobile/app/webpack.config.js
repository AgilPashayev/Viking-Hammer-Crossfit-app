const path = require('path');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env = {}, argv = {}) {
  const mode = env.mode || argv.mode || process.env.NODE_ENV || 'development';

  const config = await createExpoWebpackConfigAsync(
    { ...env, mode, projectRoot: __dirname },
    { ...argv, mode },
  );

  // Force entry to our React Native Web bootstrap file
  config.entry = path.resolve(__dirname, 'index.web.tsx');

  config.resolve = {
    ...(config.resolve || {}),
    alias: {
      ...(config.resolve?.alias || {}),
      'react-native$': 'react-native-web',
    },
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.web.js', '.js', '.jsx', '.json'],
  };

  const baseDevServer = { ...(config.devServer || {}) };
  if ('https' in baseDevServer) {
    delete baseDevServer.https;
  }

  config.devServer = {
    ...baseDevServer,
    static: {
      directory: path.resolve(__dirname, 'web'),
    },
    server: {
      type: 'http',
    },
    port: 9090,
    hot: true,
    historyApiFallback: true,
    allowedHosts: 'all',
  };

  return config;
};
