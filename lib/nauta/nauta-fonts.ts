import localFont from "next/font/local";

export const nautaSerif = localFont({
  src: "../fonts/files/fraunces/fraunces-latin-opsz-normal.woff2",
  weight: "100 900",
  variable: "--font-nauta-serif",
  display: "swap",
});

export const nautaSans = localFont({
  src: "../fonts/files/inter/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-nauta-sans",
  display: "swap",
});

export const nautaMono = localFont({
  src: [
    { path: "../fonts/files/ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/files/ibm-plex-mono/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/files/ibm-plex-mono/ibm-plex-mono-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-nauta-mono",
  display: "swap",
});

export const nautaFontClassName = [nautaSerif.variable, nautaSans.variable, nautaMono.variable].join(" ");
