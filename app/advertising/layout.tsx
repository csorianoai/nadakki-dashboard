import type { ReactNode } from "react";

/**
 * Advertising routes embed marketing surfaces (e.g. `GoogleAdsClient` with `embed`) that assume
 * a dark NADAKKI-style canvas (`text-white`, glass cards), while the Forge `main` slot defaults to
 * light institutional tokens — causing white-on-cream contrast failures.
 *
 * Do **not** wrap with `GlobalForgeAppShell` here: `AppGate` already mounts it once for the whole
 * app. Extra shells would duplicate sidebars/topbars.
 *
 * Pattern: force Tailwind `dark` scope + explicit slate background so embedded clients match
 * `/marketing/google-ads` (full `ndk-page` + dark theme) visually.
 */
export default function AdvertisingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="dark ndk-fade-in min-h-screen w-full bg-slate-950 text-slate-100 antialiased [color-scheme:dark]"
      data-advertising-dark-canvas
    >
      {children}
    </div>
  );
}
