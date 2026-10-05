import localFont from "next/font/local";
import type { ReactNode } from "react";

const inter = localFont({
  src: "../../lib/fonts/files/inter/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "../../lib/fonts/files/jetbrains-mono/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/** Isolated cockpit segment — dark theme + fonts scoped here only. */
export default function CockpitRouteGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-cockpit-bg font-cockpitSans text-cockpit-text antialiased`}
      data-cockpit-root
    >
      {children}
    </div>
  );
}
