import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor Remote Wrapper: Next.js App Router with dynamic routes
// does not support full static export. The native app loads the dealer
// UI from dashboard.nadakki.com.
const config: CapacitorConfig = {
  appId: "com.nadakki.dealer",
  appName: "Nadakki Dealer",
  webDir: "out",
  server: {
    url: "https://dashboard.nadakki.com/credit-hub/dealer",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0F172A",
      showSpinner: false,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
};

export default config;
