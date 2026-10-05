import type { ReactNode } from "react";
import { systemFont } from "@/lib/fonts/system-fonts";

// Pilas del sistema (sin Google Fonts): valores en :root de app/globals.css.
const inter = systemFont("--font-inter");
const jetbrainsMono = systemFont("--font-jetbrains-mono");

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
