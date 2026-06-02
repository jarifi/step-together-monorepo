import 'dotenv/config';

export default ({ config }) => ({
  ...config,

  name: 'step-together',
  slug: 'step-together',
  version: '1.0.4',
  scheme: 'steptogether',
  newArchEnabled: true,

  icon: './assets/images/AppIcon.png',

  android: {
    ...config.android,
    package: 'at.bfistmk.steptogether',
    permissions: (config.android?.permissions ?? []).includes('android.permission.ACTIVITY_RECOGNITION')
      ? config.android.permissions
      : [...(config.android?.permissions ?? []), 'android.permission.ACTIVITY_RECOGNITION'],
  },

  ios: {
    ...config.ios,
    bundleIdentifier: 'at.bfistmk.steptogether',
    icon: './assets/images/AppIcon.png',
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      ITSAppUsesNonExemptEncryption: false,
      NSMotionUsageDescription:
        'Step-Together benötigt Zugriff auf Bewegungsdaten, um deine Schritte und Challenge-Fortschritte anzuzeigen.',
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
    'expo-font',
  ],
});