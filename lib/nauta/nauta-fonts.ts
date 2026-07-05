import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";

export const nautaSerif = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  weight: "variable",
  variable: "--font-nauta-serif",
  display: "swap",
});

export const nautaSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-nauta-sans",
  display: "swap",
});

export const nautaMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-nauta-mono",
  display: "swap",
});

export const nautaFontClassName = [nautaSerif.variable, nautaSans.variable, nautaMono.variable].join(" ");
