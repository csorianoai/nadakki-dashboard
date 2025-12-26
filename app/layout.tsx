import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NADAKKI CONSCIOUSNESS v5000',
  description: '20 AI Cores • 247 Agents • Enterprise Multi-Tenant Platform',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased bg-quantum-void text-white min-h-screen">
        {/* Quantum Background Effect */}
        <div className="quantum-bg" />
        
        {/* Main Content */}
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
