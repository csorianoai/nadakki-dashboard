import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
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
