
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jarviz.ai',
  appName: 'JARVIZ AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Android: {
       allowMixedContent: true,
       captureInput: true,
       webContentsDebuggingEnabled: true
    }
  }
};

export default config;
