import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.krishna.dailyjournal',
  appName: 'My Daily Journal',
  webDir: 'dist',
  // Remove or comment out server config for production APK build
  // server: {
  //   url: 'https://ad887a72-e152-417a-b5ae-697d5dff2b4d.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
