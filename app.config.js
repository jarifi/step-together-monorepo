import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  name: 'step-together',
  slug: 'step-together',
  version: '1.0.0',
  scheme: 'steptogether',

  // ✅ App Icon
  icon: './assets/images/AppIcon.png',

  android: {
    ...config.android,
    package: 'at.bfistmk.steptogether',
  },

  ios: {
    ...config.ios,
    bundleIdentifier: 'at.bfistmk.steptogether',
    icon: './assets/images/AppIcon.png',
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  extra: {
    ...(config.extra ?? {}),
    apiBaseUrl: process.env.API_BASE_URL,
    appEnv: process.env.APP_ENV,
    eas: {
      projectId: '9ccbd08d-f9e6-4b85-b954-7d2da9dba801',
    },
  },

  plugins: [
    ...(config.plugins ?? []),
    'expo-secure-store',
    'expo-web-browser',
    'expo-font',
    'expo-router',
  ],
});