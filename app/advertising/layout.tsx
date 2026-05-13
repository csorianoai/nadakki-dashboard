import type { ReactNode } from "react";

/**
 * Advertising routes embed marketing surfaces (e.g. `GoogleAdsClient` with `embed`)
 * that assume the NADAKKI dark canvas (`--bg-primary` / `--text-primary` from ThemeProvider),
 * not the light Forge shell. Without this wrapper, `text-white` and glass cards render on the
 * institutional cream page background (contrast failures).
 */
export default function AdvertisingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark ndk-fade-in min-h-full w-full bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
      {children}
    </div>
  );
}
