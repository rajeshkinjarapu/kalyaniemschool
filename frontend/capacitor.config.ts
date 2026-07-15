import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jyschool.erp',
  appName: 'JY School ERP',
  webDir: 'dist',
  server: {
    // Production lo ี్కి మీ deployed backend URL పెట్టండి
    // Example: 'https://jy-school.vercel.app'
    // Development testing కి comment out చేయండి
    // url: 'https://your-backend-url.com',
    cleartext: true, // HTTP connections allow చేయడానికి (dev only)
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#243e8b',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
