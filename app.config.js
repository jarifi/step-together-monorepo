// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    name: 'step-together',
    slug: 'step-together',
    version: '1.0.0',
    extra: {
      apiBaseUrl: process.env.API_BASE_URL,
      appEnv: process.env.APP_ENV,
    },
    plugins: [
      'expo-secure-store',
      'expo-web-browser',
      'expo-font',
      'expo-router',
    ],
  },
});
