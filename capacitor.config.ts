import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.otgan.pensle',
  appName: 'PensLE',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  }
};

export default config;
