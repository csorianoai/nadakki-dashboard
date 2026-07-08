"use client";

import { FlaskConical } from "lucide-react";

export interface DemoModeBannerProps {
  /** When true, shows persistent demo strip. Must come from tenant config `is_demo` only. */
  isDemo: boolean;
}

/**
 * Global Credit Hub demo indicator. Pure presentation — callers pass `isDemo`
 * from tenant config once backend exposes `is_demo` on branding/config.
 */
export function DemoModeBanner({ isDemo }: DemoModeBannerProps) {
  if (!isDemo) return null;

  return (
    <div
      role="status"
      data-testid="credit-hub-demo-banner"
      className="credit-hub-demo-banner"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 36,
        padding: "8px 16px",
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: "var(--ch-accent-text, var(--forge-accent-text, #fbbf24))",
        background: "var(--ch-accent-soft, rgba(251, 191, 36, 0.12))",
        borderBottom: "1px solid var(--ch-accent-line, rgba(251, 191, 36, 0.35))",
        flexShrink: 0,
      }}
    >
      <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
      <span>MODO DEMO — Datos de demostración</span>
    </div>
  );
}
