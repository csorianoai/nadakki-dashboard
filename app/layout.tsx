import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import SystemStatus from "@/components/ui/SystemStatus";
import HelpCenter from "@/components/ui/HelpCenter";

export const metadata: Metadata = {
  title: "NADAKKI AI Suite",
  description: "20 AI Cores - 245 Agents - Enterprise Multi-Tenant Platform",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="quantum-bg" />
        <div className="relative z-10">
          <Providers>
            {children}
            <SystemStatus />
            <HelpCenter />
          </Providers>
        </div>
      </body>
    </html>
  );
}
