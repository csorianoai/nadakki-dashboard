import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ToastProvider } from "@/components/ui/Toast";
import PWAPrompt from "@/components/pwa/PWAPrompt";
import DashboardLayout from "@/components/layout/DashboardLayout";
import OnboardingAgent from "@/components/ai/OnboardingAgent";

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
  maximumScale: 1,
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
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <TenantProvider>
              <ToastProvider>
                <DashboardLayout>
                  {children}
                </DashboardLayout>
                <OnboardingAgent />
                <PWAPrompt />
              </ToastProvider>
            </TenantProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}