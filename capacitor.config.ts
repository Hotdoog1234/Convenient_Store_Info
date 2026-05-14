import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shieldenvironmental.ust',
  appName: 'Shield UST App',
  webDir: 'build',
  server: {
    // Point the iOS WebView at the running React dev server.
    // This lets Firebase Auth work identically to the browser during development.
    // REMOVE this server block before building for App Store / production.
    url: 'http://localhost:3000',
    cleartext: true,
  },
};

export default config;
