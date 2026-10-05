import type { Metadata, Viewport } from "next";
import "../styles/forge-tokens-v2.css";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { PWAClientProvider } from "@/components/pwa/PWAClientProvider";
import AppGate from "@/components/auth/AppGate";
import { ModalProvider } from "@/components/system/ModalRoot";
import { Toaster } from "@/components/ui/sonner";
import { systemFont } from "@/lib/fonts/system-fonts";

// Pilas del sistema (sin Google Fonts en build ni runtime): valores en :root de
// app/globals.css. Ver lib/fonts/system-fonts.
const inter = systemFont("--font-inter");
const manrope = systemFont("--font-manrope");

export const metadata: Metadata = {
  title: "Plataforma de crédito",
  description: "AI-Powered Credit Operations Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Crédito",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  /** Allow pinch-zoom (Lighthouse a11y / WCAG); avoid maximumScale: 1. */
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F172A" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Crédito" />
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
          href="/icons/apple-splash-1290x2796.png"
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable}`}>
        <AppProviders>
          <ModalProvider>
            <AppGate>{children}</AppGate>
            <Toaster />
            <PWAClientProvider />
          </ModalProvider>
        </AppProviders>
      </body>
    </html>
  );
}
