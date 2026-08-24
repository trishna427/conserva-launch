import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.conserva.app',
  appName: 'Conserva',
  webDir: 'public',

  server: {
    url: 'https://go-conserva.vercel.app',
    cleartext: false,
  },
};

export default config;