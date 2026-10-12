import localFont from "next/font/local";
import { RealtorShell } from "@/components/realtor/shell/RealtorShell";

const plex = localFont({
  src: [
    { path: "./fonts/IBMPlexSans-400-latin.woff2", weight: "400" },
    { path: "./fonts/IBMPlexSans-600-latin.woff2", weight: "600" },
    { path: "./fonts/IBMPlexSans-700-latin.woff2", weight: "700" },
  ],
  variable: "--rt-font-body",
  display: "swap",
});
const grotesk = localFont({
  src: [
    { path: "./fonts/SpaceGrotesk-500-latin.woff2", weight: "500" },
    { path: "./fonts/SpaceGrotesk-700-latin.woff2", weight: "700" },
  ],
  variable: "--rt-font-display",
  display: "swap",
});

export default function RealtorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${plex.variable} ${grotesk.variable}`}>
      <RealtorShell>{children}</RealtorShell>
    </div>
  );
}
