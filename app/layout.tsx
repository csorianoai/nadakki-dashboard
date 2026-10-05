import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "../styles/forge-tokens-v2.css";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { PWAClientProvider } from "@/components/pwa/PWAClientProvider";
import AppGate from "@/components/auth/AppGate";
import { ModalProvider } from "@/components/system/ModalRoot";
import { Toaster } from "@/components/ui/sonner";

const inter = localFont({
  src: "../lib/fonts/files/inter/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const manrope = localFont({
  src: "../lib/fonts/files/manrope/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});

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
      <body className={`${inter.variable} ${manrope.variable} ${inter.className}`}>
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
