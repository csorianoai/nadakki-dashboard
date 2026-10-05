"use client";

import localFont from "next/font/local";
import type { ReactNode } from "react";

const sourceSerif = localFont({
  src: "../../../../lib/fonts/files/source-serif-4/source-serif-4-latin-wght-normal.woff2",
  weight: "200 900",
  variable: "--font-source-serif",
  display: "swap",
});

const ibmSans = localFont({
  src: "../../../../lib/fonts/files/ibm-plex-sans/ibm-plex-sans-latin-wght-normal.woff2",
  weight: "100 700",
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmMono = localFont({
  src: [
    { path: "../../../../lib/fonts/files/ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../../../lib/fonts/files/ibm-plex-mono/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export function ResearchPapelFonts({ children }: { children: ReactNode }) {
  return (
    <div className={`${sourceSerif.variable} ${ibmSans.variable} ${ibmMono.variable} legal-research-papel`}>
      {children}
    </div>
  );
}
