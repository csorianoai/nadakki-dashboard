import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "../styles/forge-tokens-v2.css";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { PWAClientProvider } from "@/components/pwa/PWAClientProvider";
import AppGate from "@/components/auth/AppGate";
import { ThemeProvider } from "@/components/system/ThemeProvider";
import { TenantProvider } from "@/components/system/TenantProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
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
          <ThemeProvider>
            <TenantProvider>
              <AppGate>{children}</AppGate>
              <Toaster />
              <PWAClientProvider />
            </TenantProvider>
          </ThemeProvider>
        </AppProviders>
      </body>
    </html>
  );
}
