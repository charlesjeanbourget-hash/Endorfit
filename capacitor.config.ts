import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.synapse.fitness',
  appName: 'ENDORFIT',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
