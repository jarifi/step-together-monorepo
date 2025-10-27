import 'dotenv/config';

export default ({ config }) => ({
  // Ensure we spread the base configuration
  ...config,
  expo: {
    ...config.expo,
    name: 'step-together',
    slug: 'step-together',
    version: '1.0.0',
    scheme: 'steptogether',
    
    // CRITICAL ADDITIONS: Add required native identifiers for Android and iOS builds
    android: {
      // Required for Android builds, typically in the format: com.username.appslug
      package: 'com.jear77.steptogether',
    },
    ios: {
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      },
      // Required for iOS builds
      bundleIdentifier: 'com.jear77.steptogether',
    },
    
    // CRITICAL FIX: Merge new 'extra' properties with existing ones
    extra: {
      // FIX: Use optional chaining (?.) to safely access 'extra' if 'expo' exists,
      // and default to an empty object if 'extra' is undefined.
      ...(config.expo?.extra || {}), 
      
      // Your environment variables
      apiBaseUrl: process.env.API_BASE_URL,
      appEnv: process.env.APP_ENV,
      
      // Manually insert the project ID that EAS created
      eas: {
        projectId: '9ccbd08d-f9e6-4b85-b954-7d2da9dba801',
      },
    },
    
    plugins: [
      'expo-secure-store',
      'expo-web-browser',
      'expo-font',
      'expo-router',
    ],
  },
});
