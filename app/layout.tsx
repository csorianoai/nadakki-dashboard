import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../styles/forge-tokens-v2.css";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import PWAPrompt from "@/components/pwa/PWAPrompt";
import AppGate from "@/components/auth/AppGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NADAKKI AI Suite",
  description: "AI-Powered Marketing Automation Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NADAKKI",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  /** Allow pinch-zoom (Lighthouse a11y / WCAG); avoid `maximumScale: 1`. */
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <AppProviders>
          <AppGate>{children}</AppGate>
        </AppProviders>
      </body>
    </html>
  );
}
