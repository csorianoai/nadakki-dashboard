import { systemFont } from "@/lib/fonts/system-fonts";

// Pilas del sistema (sin Google Fonts): valores en :root de app/globals.css.
export const nautaSerif = systemFont("--font-nauta-serif");
export const nautaSans = systemFont("--font-nauta-sans");
export const nautaMono = systemFont("--font-nauta-mono");

export const nautaFontClassName = [nautaSerif.variable, nautaSans.variable, nautaMono.variable].join(" ");
