import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cardsurvival.ruinedcity',
  appName: 'Card Survival: Ruined City',
  webDir: 'dist-web',

  android: {
    // 혼합 콘텐츠 허용 (로컬 assets 접근)
    allowMixedContent: true,
    // 갤럭시 S26 기준 하드웨어 가속
    backgroundColor: '#0d0d0d',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0d0d0d',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'large',
      spinnerColor: '#c8a060',
    },
    StatusBar: {
      // 상태바를 게임 배경색과 통일
      overlaysWebView: false,
      style: 'dark',
      backgroundColor: '#0d0d0d',
    },
  },
};

export default config;
