import fs from 'fs';
import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo config. Values come from environment variables so that secrets
 * never live in git. See `.env.example` and docs/DEPLOYMENT.md.
 *
 * EXPO_PUBLIC_* variables are inlined into the JS bundle (safe for public keys only).
 * Variables without the prefix are only read here at build time.
 */
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID;
const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Glam & Glow',
  slug: 'glam-and-glow',
  scheme: 'glamandglow',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#FAF6F2',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.glamandglow.app',
  },
  android: {
    package: 'com.glamandglow.app',
    adaptiveIcon: {
      backgroundColor: '#FAF6F2',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    // Required for FCM push on Android. Download from Firebase console; never commit it.
    googleServicesFile: GOOGLE_SERVICES_JSON && fs.existsSync(GOOGLE_SERVICES_JSON) ? GOOGLE_SERVICES_JSON : undefined,
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    output: 'single',
    name: 'Glam & Glow',
    themeColor: '#7B3A34',
    backgroundColor: '#FAF6F2',
  },
  plugins: [
    'expo-font',
    'expo-image',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        backgroundColor: '#FAF6F2',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Glam & Glow needs your photos to upload portfolio and review images.',
        cameraPermission: 'Glam & Glow needs the camera for KYC selfies and portfolio photos.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Glam & Glow uses your location to find artists near you and to fill in your address.',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#7B3A34',
        defaultChannel: 'default',
      },
    ],
    [
      'react-native-maps',
      {
        // Native map tiles from the Google Maps SDKs are free on Android/iOS (no per-load cost).
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY,
        iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_KEY,
      },
    ],
    'expo-updates',
  ],
  updates: EAS_PROJECT_ID ? { url: `https://u.expo.dev/${EAS_PROJECT_ID}` } : undefined,
  runtimeVersion: { policy: 'appVersion' },
  extra: {
    eas: EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined,
  },
});
