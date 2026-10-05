"use client";

import type { ReactNode } from "react";
import { systemFont } from "@/lib/fonts/system-fonts";

// Pilas del sistema (sin Google Fonts): valores en :root de app/globals.css.
const sourceSerif = systemFont("--font-source-serif");
const ibmSans = systemFont("--font-ibm-plex-sans");
const ibmMono = systemFont("--font-ibm-plex-mono");

export function ResearchPapelFonts({ children }: { children: ReactNode }) {
  return (
    <div className={`${sourceSerif.variable} ${ibmSans.variable} ${ibmMono.variable} legal-research-papel`}>
      {children}
    </div>
  );
}
